import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubcontractorWork } from './entities/subcontractor-work.entity.js';
import { CreateSubcontractorWorkDto } from './dto/create-subcontractor-work.dto.js';
import { UpdateSubcontractorWorkStatusDto } from './dto/update-subcontractor-work-status.dto.js';
import { Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

type RequestUser = { id: string; role: string };

@Injectable()
export class SubcontractorWorkService {
  constructor(
    @InjectRepository(SubcontractorWork)
    private readonly repo: Repository<SubcontractorWork>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    dto: CreateSubcontractorWorkDto,
    userId: string,
    files?: Express.Multer.File[],
  ) {
    const photoUrls = files?.map((f) => `/uploads/subcontractor-work/${f.filename}`) || [];
    const photoKeys = files?.map((f) => f.filename) || [];

    const record = this.repo.create({
      projectId: dto.projectId,
      subcontractorId: dto.subcontractorId,
      subcontractWorkOrderId: dto.subcontractWorkOrderId || null,
      notes: dto.notes,
      photoUrls: photoUrls.length ? photoUrls : undefined,
      photoKeys: photoKeys.length ? photoKeys : undefined,
      createdById: userId,
      status: 'pending',
    });
    const saved = await this.repo.save(record);

    await this.notifications.createForRole(Role.PURCHASE_TEAM, {
      userId,
      type: 'subcontractor_work',
      title: 'New Subcontractor Work Submitted',
      message: `A subcontractor work entry was submitted for review`,
      link: '/dashboard/subcontractor-work',
      entityId: saved.id,
    });

    return this.findOne(saved.id);
  }

  async findAll(user: RequestUser) {
    const where: any = { isDeleted: false };
    if (user.role === Role.SITE_ENGINEER) {
      where.createdById = user.id;
    }
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const record = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!record) throw new NotFoundException('Subcontractor work entry not found');
    return record;
  }

  async updateStatus(id: string, dto: UpdateSubcontractorWorkStatusDto, userId: string) {
    const record = await this.findOne(id);
    record.status = dto.status;
    record.respondedById = userId;
    record.respondedAt = new Date();
    await this.repo.save(record);

    await this.notifications.createForUser(record.createdById, {
      userId,
      type: 'subcontractor_work_response',
      title: dto.status === 'approved' ? 'Subcontractor Work Approved' : dto.status === 'rejected' ? 'Subcontractor Work Rejected' : 'Subcontractor Work Updated',
      message: `Your subcontractor work submission was marked ${dto.status}`,
      link: '/dashboard/subcontractor-work',
      entityId: record.id,
    });

    return this.findOne(id);
  }

  async remove(id: string, user: RequestUser) {
    const record = await this.findOne(id);
    if (user.role === Role.SITE_ENGINEER && record.createdById !== user.id) {
      throw new ForbiddenException('You can only delete your own submissions');
    }
    record.isDeleted = true;
    await this.repo.save(record);
    return { success: true };
  }
}
