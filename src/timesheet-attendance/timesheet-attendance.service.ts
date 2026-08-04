import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WeeklyTimesheet } from './entities/weekly-timesheet.entity.js';
import { TimesheetRow } from './entities/timesheet-row.entity.js';
import { CreateTimesheetDto } from './dto/create-timesheet.dto.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { User } from '../users/entities/user.entity.js';
import { PaymentType, PaymentMode, Role } from '../common/enums.js';

@Injectable()
export class TimesheetAttendanceService {
  constructor(
    @InjectRepository(WeeklyTimesheet)
    private tsRepo: Repository<WeeklyTimesheet>,
    @InjectRepository(TimesheetRow)
    private rowRepo: Repository<TimesheetRow>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private calcWeekEnd(weekStart: string): string {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end.toISOString().split('T')[0];
  }

  async create(dto: CreateTimesheetDto, siteEngineerId: string) {
    if (dto.rows.length === 0)
      throw new BadRequestException(
        'Nothing to save — add hours or a project first',
      );

    let ts = await this.tsRepo.findOne({
      where: {
        siteEngineerId,
        weekStart: new Date(dto.weekStart),
        isDeleted: false,
      },
      order: { updatedAt: 'DESC' },
    });

    if (!ts) {
      const weekEnd = this.calcWeekEnd(dto.weekStart);
      ts = this.tsRepo.create({
        siteEngineerId,
        weekStart: new Date(dto.weekStart),
        weekEnd: new Date(weekEnd),
      });
      await this.tsRepo.save(ts);
    }

    await this.rowRepo.delete({ timesheetId: ts.id });
    const rows = dto.rows.map((r) =>
      this.rowRepo.create({ ...r, timesheetId: ts.id }),
    );
    ts.rows = await this.rowRepo.save(rows);
    ts.totalHours = this.calcTotal(ts.rows);
    return this.tsRepo.save(ts);
  }

  async findByWeek(siteEngineerId: string, weekStart: string) {
    return this.tsRepo.findOne({
      where: {
        siteEngineerId,
        weekStart: new Date(weekStart),
        isDeleted: false,
      },
      relations: ['rows'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const ts = await this.tsRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['rows'],
    });
    if (!ts) throw new NotFoundException('Timesheet not found');
    return this.attachSiteEngineer(ts);
  }

  async findAll(status?: string, page = 1, limit = 50) {
    const where: any = { isDeleted: false };
    if (status) where.status = status;
    const [data, total] = await this.tsRepo.findAndCount({
      where,
      relations: ['rows'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const enriched = await this.attachSiteEngineerMany(data);
    return { data: enriched, total, page, limit };
  }

  private readonly ROW_DAY_KEYS = [
    'monHours',
    'tueHours',
    'wedHours',
    'thuHours',
    'friHours',
    'satHours',
    'sunHours',
  ] as const;

  async update(id: string, dto: CreateTimesheetDto, userId: string) {
    const ts = await this.findOne(id);
    if (ts.siteEngineerId !== userId)
      throw new ForbiddenException('Not your timesheet');
    if (
      ts.status === 'verified' ||
      ts.status === 'admin_approved' ||
      ts.status === 'approved'
    )
      throw new BadRequestException('Cannot edit verified/approved timesheet');

    if (dto.rows.length === 0)
      throw new BadRequestException(
        'Nothing to save — add hours or a project first',
      );

    const existingRows = await this.rowRepo.find({
      where: { timesheetId: id },
    });
    const existingMap = new Map(existingRows.map((r) => [r.id, r]));

    for (const payloadRow of dto.rows) {
      const existing = payloadRow.id
        ? existingMap.get(payloadRow.id)
        : undefined;
      if (!existing) continue;
      const mask = Number(existing.submittedMask || 0);
      for (let d = 0; d < this.ROW_DAY_KEYS.length; d++) {
        const cellLocked = (mask & (1 << d)) !== 0;
        if (
          cellLocked &&
          Number(existing[this.ROW_DAY_KEYS[d]]) !==
            Number((payloadRow as any)[this.ROW_DAY_KEYS[d]])
        ) {
          throw new BadRequestException('Cannot edit submitted hours');
        }
      }
    }

    await this.rowRepo.delete({ timesheetId: id });
    const rows = dto.rows.map((r) => {
      const existing = r.id ? existingMap.get(r.id) : undefined;
      return this.rowRepo.create({
        ...r,
        timesheetId: id,
        submittedMask: existing ? existing.submittedMask : 0,
      });
    });
    ts.rows = await this.rowRepo.save(rows);
    ts.totalHours = this.calcTotal(ts.rows);
    return this.tsRepo.save(ts);
  }

  async submit(id: string, userId: string) {
    const ts = await this.findOne(id);
    if (ts.siteEngineerId !== userId)
      throw new ForbiddenException('Not your timesheet');
    if (
      ts.status === 'verified' ||
      ts.status === 'admin_approved' ||
      ts.status === 'approved'
    )
      throw new BadRequestException('Timesheet already processed');

    for (const row of ts.rows) {
      let mask = Number(row.submittedMask || 0);
      for (let d = 0; d < this.ROW_DAY_KEYS.length; d++) {
        if (Number(row[this.ROW_DAY_KEYS[d]]) > 0) {
          mask |= 1 << d;
        }
      }
      if (row.remark) mask |= 1 << 7;
      row.submittedMask = mask;
    }
    await this.rowRepo.save(ts.rows);
    ts.status = 'submitted';
    return this.tsRepo.save(ts);
  }

  async verify(id: string, userId: string) {
    const ts = await this.findOne(id);
    if (ts.status !== 'pending' && ts.status !== 'submitted')
      throw new BadRequestException(
        'Only pending/submitted timesheets can be verified',
      );
    ts.status = 'verified';
    ts.approvedById = userId;
    ts.approvedAt = new Date();
    return this.tsRepo.save(ts);
  }

  async approve(id: string, requester: { id: string; role: string }) {
    const userId = requester.id;
    const ts = await this.findOne(id);
    // Admins can approve directly — they're the top authority and don't need
    // an accounts-manager to verify first. Admins approving their own
    // timesheet can also skip the verify step for the same reason.
    const isSelfApprove =
      ts.siteEngineerId === userId && ts.status === 'submitted';
    const isAdminOverride = requester.role === Role.ADMIN;
    if (ts.status !== 'verified' && !isSelfApprove && !isAdminOverride)
      throw new BadRequestException('Only verified timesheets can be approved');

    const user = await this.userRepo.findOne({
      where: { id: ts.siteEngineerId },
      relations: ['salaryGrade'],
    });
    if (!user) throw new NotFoundException('Site engineer not found');
    if (!user.salaryGrade)
      throw new BadRequestException(
        'Site engineer has no salary grade assigned',
      );

    const avgCostPerHr = Number(user.salaryGrade.avgCostPerHr);

    let totalCost = 0;
    for (const row of ts.rows) {
      if (!row.projectId) continue;
      const rowHours =
        Number(row.monHours) +
        Number(row.tueHours) +
        Number(row.wedHours) +
        Number(row.thuHours) +
        Number(row.friHours) +
        Number(row.satHours) +
        Number(row.sunHours);
      const rowAmount = rowHours * avgCostPerHr;
      row.amount = rowAmount;
      totalCost += rowAmount;
    }
    await this.rowRepo.save(ts.rows);

    const weekLabel = new Date(ts.weekStart).toISOString().split('T')[0];
    const payment = this.paymentRepo.create({
      paymentType: PaymentType.LABOUR,
      amount: totalCost,
      paymentDate: new Date(),
      payeeName: user.name || user.email || 'Site Engineer',
      notes: `Timesheet ${weekLabel} - ${user.name || ''}`,
      projectId: ts.rows.find((r) => r.projectId)?.projectId ?? undefined,
      createdBy: userId,
      timesheetId: ts.id,
    });
    await this.paymentRepo.save(payment);

    ts.status = 'approved';
    ts.approvedById = userId;
    ts.approvedAt = new Date();
    return this.tsRepo.save(ts);
  }

  async reject(id: string, userId: string) {
    const ts = await this.findOne(id);
    if (ts.status === 'approved')
      throw new BadRequestException('Already approved');
    ts.status = 'rejected';
    ts.approvedById = userId;
    ts.approvedAt = new Date();
    return this.tsRepo.save(ts);
  }

  async remove(id: string, userId: string) {
    const ts = await this.findOne(id);
    if (ts.siteEngineerId !== userId)
      throw new ForbiddenException('Not your timesheet');
    ts.isDeleted = true;
    return this.tsRepo.save(ts);
  }

  private calcTotal(rows: TimesheetRow[]) {
    return rows.reduce((sum, r) => {
      return (
        sum +
        Number(r.monHours) +
        Number(r.tueHours) +
        Number(r.wedHours) +
        Number(r.thuHours) +
        Number(r.friHours) +
        Number(r.satHours) +
        Number(r.sunHours)
      );
    }, 0);
  }

  private async attachSiteEngineer(ts: WeeklyTimesheet) {
    if (ts.siteEngineerId) {
      const user = await this.userRepo.findOne({
        where: { id: ts.siteEngineerId },
        relations: ['salaryGrade'],
      });
      (ts as any).siteEngineer = user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            employeeId: user.employeeId,
            phone: user.phone,
            role: user.role,
            salaryGrade: user.salaryGrade,
          }
        : null;
    }
    return ts;
  }

  private async attachSiteEngineerMany(list: WeeklyTimesheet[]) {
    const ids = [...new Set(list.map((t) => t.siteEngineerId).filter(Boolean))];
    if (ids.length === 0) return list;
    const users = await this.userRepo.find({
      where: { id: In(ids) },
      relations: ['salaryGrade'],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    for (const ts of list) {
      const user = userMap.get(ts.siteEngineerId);
      (ts as any).siteEngineer = user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            employeeId: user.employeeId,
            phone: user.phone,
            role: user.role,
            salaryGrade: user.salaryGrade,
          }
        : null;
    }
    return list;
  }
}
