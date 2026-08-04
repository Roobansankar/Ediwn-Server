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

@Injectable()
export class EmployeeQueriesService {
  constructor(
    @InjectRepository(EmployeeQuery)
    private queryRepo: Repository<EmployeeQuery>,
    @InjectRepository(WeeklyTimesheet)
    private tsRepo: Repository<WeeklyTimesheet>,
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
        status: 'pending',
        isDeleted: false,
      },
    });
    if (existing)
      throw new ConflictException('An edit request is already pending');

    const query = this.queryRepo.create({
      timesheetId: dto.timesheetId,
      siteEngineerId: userId,
      reason: dto.reason,
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
      for (const row of ts.rows) row.submittedMask = 0;
      ts.status = 'pending';
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
    return this.queryRepo.findOne({ where: { id }, relations: ['timesheet'] });
  }
}
