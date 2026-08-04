import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyLabourReport } from './entities/daily-labour-report.entity.js';
import { DailyWorker } from './entities/daily-worker.entity.js';
import { CreateDailyLabourReportDto } from './dto/create-daily-labour.dto.js';
import { Role } from '../common/enums.js';

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
      .leftJoinAndSelect('report.createdBy', 'createdBy')
      .leftJoinAndSelect('report.workers', 'workers')
      .leftJoinAndSelect('workers.tradeRel', 'tradeRel')
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
      relations: ['project', 'createdBy', 'workers', 'workers.tradeRel'],
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

  async updateWorkerStatus(reportId: string, workerId: string, status: string) {
    const validStatuses = ['pending', 'approved', 'rejected'];
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
    return this.workerRepo.save(worker);
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

    return this.findOne(id);
  }
}
