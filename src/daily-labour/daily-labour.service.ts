import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DailyLabourReport } from './entities/daily-labour-report.entity.js';
import { DailyWorker } from './entities/daily-worker.entity.js';
import { CreateDailyLabourReportDto } from './dto/create-daily-labour.dto.js';
import { Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const PHOTO_SLOTS = [1, 2, 3, 4, 5] as const;

/**
 * Maps uploaded worker_{index}_{morning|evening}Photo{1..5} files onto the
 * worker's discrete morningPhotoNUrl/eveningPhotoNUrl columns.
 */
function applyPhotoFiles(
  worker: DailyWorker,
  files: Express.Multer.File[] | undefined,
  workerIndex: number,
) {
  if (!files) return;
  const target = worker as unknown as Record<string, string>;
  for (const session of ['morning', 'evening'] as const) {
    for (const slot of PHOTO_SLOTS) {
      const field = `worker_${workerIndex}_${session}Photo${slot}`;
      const file = files.find((f) => f.fieldname === field);
      if (file) {
        target[`${session}Photo${slot}Url`] = `/uploads/dpw/${file.filename}`;
      }
    }
  }
}

@Injectable()
export class DailyLabourService {
  constructor(
    @InjectRepository(DailyLabourReport)
    private readonly reportRepo: Repository<DailyLabourReport>,
    @InjectRepository(DailyWorker)
    private readonly workerRepo: Repository<DailyWorker>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    dto: CreateDailyLabourReportDto,
    userId: string,
    files?: Express.Multer.File[],
  ) {
    const report = this.reportRepo.create({
      projectId: dto.projectId,
      reportDate: new Date(dto.reportDate),
      remarks: dto.remarks,
      createdById: userId,
    });

    // Save report first to get ID
    const savedReport = await this.reportRepo.save(report);

    // Create and save workers
    if (dto.workers && dto.workers.length > 0) {
      const workers = dto.workers.map((w, index) => {
        const worker = this.workerRepo.create({
          ...w,
          reportId: savedReport.id,
        });

        applyPhotoFiles(worker, files, index);

        return worker;
      });
      await this.workerRepo.save(workers);
    }

    return this.findOne(savedReport.id);
  }

  async findAll(user: any, projectId?: string) {
    const query = this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.project', 'project')
      .leftJoinAndSelect('project.projectCategory', 'projectCategory')
      .leftJoinAndSelect('report.createdBy', 'createdBy')
      .leftJoinAndSelect('report.workers', 'workers')
      .leftJoinAndSelect('workers.tradeRel', 'tradeRel')
      .leftJoinAndSelect('tradeRel.team', 'tradeTeam')
      .where('report.isDeleted = false');

    if (projectId) {
      query.andWhere('report.projectId = :projectId', { projectId });
    }

    // Site engineers only see their own reports
    if (user.role === Role.SITE_ENGINEER) {
      query.andWhere('report.createdById = :userId', { userId: user.id });
    }

    query.orderBy('report.reportDate', 'DESC');

    return await query.getMany();
  }

  async findOne(id: string) {
    const report = await this.reportRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['project', 'createdBy', 'workers', 'workers.tradeRel', 'workers.tradeRel.team'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async updateStatus(id: string, status: string) {
    const report = await this.findOne(id);
    report.status = status;
    return this.reportRepo.save(report);
  }

  async updateWorkerStatus(
    reportId: string,
    workerId: string,
    status: string,
    remarks?: string,
    actorUserId?: string,
  ) {
    const validStatuses = ['pending', 'approved', 'admin_approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }
    const worker = await this.workerRepo.findOne({
      where: { id: workerId, reportId },
    });
    if (!worker) {
      throw new NotFoundException(
        `Worker with ID ${workerId} not found in report ${reportId}`,
      );
    }
    worker.status = status;
    // Only overwrite the stored remark when one was actually sent, so a
    // plain re-approve doesn't silently wipe out a prior rejection reason.
    if (remarks !== undefined) {
      worker.reviewRemarks = remarks || null;
    }
    await this.workerRepo.save(worker);

    // Report-level status is derived from the trade (worker) statuses set by
    // accounts, not set manually — rejected if any trade is rejected,
    // approved once every trade is approved, pending otherwise.
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['workers'],
    });
    if (report) {
      report.status = this.computeReportStatus(report.workers);
      await this.reportRepo.save(report);

      // Let the site engineer who submitted this entry know which specific
      // trade was approved/rejected, and why (when a remark was given).
      if (report.createdById && (status === 'approved' || status === 'admin_approved' || status === 'rejected')) {
        await this.notifications.createForUser(report.createdById, {
          userId: actorUserId,
          type: 'daily_labour_worker_status',
          title: status === 'rejected' ? 'Trade Entry Rejected' : 'Trade Entry Approved',
          message:
            status === 'rejected'
              ? `${worker.trade} entry was rejected${remarks ? ` — ${remarks}` : ''}`
              : `${worker.trade} entry was approved`,
          link: `/dashboard/daily-labour/${reportId}`,
          entityId: workerId,
        });
      }
    }

    return worker;
  }

  // Sets one status on every trade entry of several reports (a week on the
  // Approvals page). Each trade follows the same rules as updateWorkerStatus.
  // When accounts approve a week, admin is notified; when admin gives the final
  // approval, accounts is notified.
  async setWeekStatus(
    reportIds: string[],
    status: string,
    actor: { id: string; role: string },
    weekLabel: string,
    remarks?: string,
  ) {
    const validStatuses = ['pending', 'approved', 'admin_approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }
    if (status === 'admin_approved' && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can give final approval');
    }

    const reports = await this.reportRepo.find({
      where: { id: In(reportIds), isDeleted: false },
      relations: ['workers', 'createdBy', 'project'],
    });

    let changed = 0;
    for (const report of reports) {
      for (const worker of report.workers || []) {
        const current = worker.status || 'pending';
        if (current === status) continue;
        // Accounts never changes an admin approval.
        if (actor.role !== Role.ADMIN && current === 'admin_approved') continue;
        // Paid entries are not reopened or rejected.
        if (worker.labourPaymentId && (status === 'pending' || status === 'rejected')) continue;
        await this.updateWorkerStatus(report.id, worker.id, status, remarks, actor.id);
        changed += 1;
      }
    }

    if (changed > 0) {
      const team = reports[0]?.createdBy?.name || '-';
      const project = reports[0]?.project?.name || '-';
      const entries = `${changed} trade entr${changed === 1 ? 'y' : 'ies'}`;
      const where = `${team} · ${project} · ${weekLabel}`;
      if (actor.role === Role.ACCOUNTS_MANAGER && status === 'approved') {
        await this.notifications.createForRole(Role.ADMIN, {
          userId: actor.id,
          type: 'daily_labour_week_status',
          title: 'Week Approved by Accounts',
          message: `${entries} approved by accounts — ${where}`,
          link: '/dashboard/approvals',
        });
      }
      if (actor.role === Role.ADMIN && status === 'admin_approved') {
        await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
          userId: actor.id,
          type: 'daily_labour_week_status',
          title: 'Week Approved by Admin',
          message: `${entries} given final admin approval — ${where}`,
          link: '/dashboard/approvals',
        });
      }
    }

    return { changed };
  }

  private computeReportStatus(workers: DailyWorker[]): string {
    if (workers.length === 0) return 'pending';
    if (workers.some((w) => w.status === 'rejected')) return 'rejected';
    // Admin Approved counts as approved for the report as a whole.
    if (workers.every((w) => w.status === 'approved' || w.status === 'admin_approved')) return 'approved';
    return 'pending';
  }

  async remove(id: string) {
    const report = await this.reportRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    await this.reportRepo.update(id, { isDeleted: true });
    return { success: true };
  }

  async update(
    id: string,
    dto: CreateDailyLabourReportDto,
    files?: Express.Multer.File[],
  ) {
    const report = await this.findOne(id);

    report.projectId = dto.projectId;
    report.reportDate = new Date(dto.reportDate);
    report.remarks = dto.remarks || '';

    await this.reportRepo.save(report);

    // Delete existing workers and create new ones
    await this.workerRepo.delete({ reportId: id });

    if (dto.workers && dto.workers.length > 0) {
      const workers = dto.workers.map((w, index) => {
        const worker = this.workerRepo.create({
          ...w,
          reportId: id,
        });

        // worker already carries w.morningPhotoNUrl/eveningPhotoNUrl from the
        // `...w` spread above (existing URLs kept as-is); this only
        // overwrites the slots that got a new file in this request.
        applyPhotoFiles(worker, files, index);

        return worker;
      });
      await this.workerRepo.save(workers);
    }

    // Workers were just recreated (all back to their default 'pending'
    // status), so the derived report status must be recomputed to match —
    // otherwise it would keep showing a stale approved/rejected state.
    const updated = await this.findOne(id);
    updated.status = this.computeReportStatus(updated.workers);
    await this.reportRepo.save(updated);

    return updated;
  }
}
