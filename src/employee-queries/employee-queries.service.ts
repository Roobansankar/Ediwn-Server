import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeQuery } from './entities/employee-query.entity.js';
import { CreateEmployeeQueryDto } from './dto/create-employee-query.dto.js';
import { RespondEmployeeQueryDto } from './dto/respond-employee-query.dto.js';
import { WeeklyTimesheet } from '../timesheet-attendance/entities/weekly-timesheet.entity.js';
import { Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Injectable()
export class EmployeeQueriesService {
  constructor(
    @InjectRepository(EmployeeQuery)
    private queryRepo: Repository<EmployeeQuery>,
    @InjectRepository(WeeklyTimesheet)
    private tsRepo: Repository<WeeklyTimesheet>,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateEmployeeQueryDto, userId: string) {
    const ts = await this.tsRepo.findOne({
      where: { id: dto.timesheetId, isDeleted: false },
    });
    if (!ts) throw new NotFoundException('Timesheet not found');
    if (ts.siteEngineerId !== userId)
      throw new ForbiddenException('Not your timesheet');

    if (ts.status === 'pending')
      throw new BadRequestException(
        'Timesheet is already editable — no need to request',
      );
    if (
      ts.status === 'verified' ||
      ts.status === 'admin_approved' ||
      ts.status === 'approved'
    )
      throw new BadRequestException(
        'Timesheet is already processed and cannot be reopened',
      );

    const existing = await this.queryRepo.findOne({
      where: {
        timesheetId: dto.timesheetId,
        siteEngineerId: userId,
        dayIndex: dto.dayIndex,
        status: 'pending',
        isDeleted: false,
      },
    });
    if (existing)
      throw new ConflictException(
        'An edit request for that day is already pending',
      );

    const query = this.queryRepo.create({
      timesheetId: dto.timesheetId,
      siteEngineerId: userId,
      reason: dto.reason,
      dayIndex: dto.dayIndex,
      status: 'pending',
    });
    return this.queryRepo.save(query);
  }

  async findAll(user: { id: string; role: string }, status?: string) {
    const where: any = { isDeleted: false };
    if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTS_MANAGER) {
      where.siteEngineerId = user.id;
    }
    if (status) where.status = status;
    return this.queryRepo.find({
      where,
      relations: ['timesheet'],
      order: { createdAt: 'DESC' },
    });
  }

  async respond(id: string, dto: RespondEmployeeQueryDto, adminUserId: string) {
    const query = await this.queryRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['timesheet'],
    });
    if (!query) throw new NotFoundException('Edit request not found');
    if (query.status !== 'pending')
      throw new BadRequestException('Request already responded');

    if (dto.action === 'approved') {
      const ts = query.timesheet;
      // ts.rows is an eager relation loaded alongside ts — mutate it in place
      // and let the cascade save persist both in one go. A separate raw
      // rowRepo.update() here would get clobbered by this cascade save
      // re-writing the (stale, pre-update) in-memory rows over it.
      if (query.dayIndex !== null && query.dayIndex !== undefined) {
        // Only clear this specific day's lock bit — the rest of the week
        // stays submitted/locked (and visible in the admin verify queue).
        for (const row of ts.rows) {
          row.submittedMask = Number(row.submittedMask || 0) & ~(1 << query.dayIndex);
        }
      } else {
        // Legacy request with no day recorded — fall back to the old
        // whole-week unlock behavior.
        for (const row of ts.rows) row.submittedMask = 0;
        ts.status = 'pending';
      }
      await this.tsRepo.save(ts);
    }

    // Use a partial update rather than saving the loaded entity: `query`
    // carries an eager `siteEngineer` relation that can resolve to null
    // (e.g. if that lookup fails for any reason), and TypeORM's save()
    // would then null out the siteEngineerId FK column from that stale
    // relation object, violating the NOT NULL constraint.
    await this.queryRepo.update(id, {
      status: dto.action,
      respondedById: adminUserId,
      respondedAt: new Date(),
    });

    const dayLabel =
      query.dayIndex !== null && query.dayIndex !== undefined
        ? DAY_LABELS[query.dayIndex]
        : 'your timesheet';
    await this.notifications.createForUser(query.siteEngineerId, {
      userId: adminUserId,
      type: 'employee_query_response',
      title: dto.action === 'approved' ? 'Edit Request Approved' : 'Edit Request Rejected',
      message:
        dto.action === 'approved'
          ? `Your edit request for ${dayLabel} was approved — you can now correct it.`
          : `Your edit request for ${dayLabel} was rejected.`,
      link: '/dashboard/timesheet-attendance',
      entityId: query.timesheetId,
    });

    return this.queryRepo.findOne({ where: { id }, relations: ['timesheet'] });
  }
}
