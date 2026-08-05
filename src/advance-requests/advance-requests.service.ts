import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvanceRequest } from './entities/advance-request.entity.js';
import { CreateAdvanceRequestDto } from './dto/create-advance-request.dto.js';
import { RespondAdvanceRequestDto } from './dto/respond-advance-request.dto.js';
import { Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class AdvanceRequestsService {
  constructor(
    @InjectRepository(AdvanceRequest)
    private repo: Repository<AdvanceRequest>,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateAdvanceRequestDto, userId: string) {
    const request = this.repo.create({
      vendorId: dto.vendorId,
      projectId: dto.projectId,
      materialRequirementNo: dto.materialRequirementNo || null,
      vendorQuotationId: dto.vendorQuotationId || null,
      amount: dto.amount,
      notes: dto.notes || null,
      requestedById: userId,
      status: 'pending',
    });
    const saved = await this.repo.save(request);

    await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
      userId,
      type: 'advance_request',
      title: 'New Advance Request',
      message: `An advance of ${dto.amount} was requested${dto.materialRequirementNo ? ` for ${dto.materialRequirementNo}` : ''}`,
      link: '/dashboard/advance-requests',
      entityId: saved.id,
    });

    return saved;
  }

  async findAll(user: { id: string; role: string }, status?: string) {
    const where: any = { isDeleted: false };
    if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTS_MANAGER) {
      where.requestedById = user.id;
    }
    if (status) where.status = status;
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async respond(id: string, dto: RespondAdvanceRequestDto, userId: string) {
    const request = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!request) throw new NotFoundException('Advance request not found');
    if (request.status !== 'pending')
      throw new BadRequestException('Request already responded');

    await this.repo.update(id, {
      status: dto.action,
      respondedById: userId,
      respondedAt: new Date(),
    });

    await this.notifications.createForUser(request.requestedById, {
      userId,
      type: 'advance_request_response',
      title: dto.action === 'accepted' ? 'Advance Request Accepted' : 'Advance Request Rejected',
      message:
        dto.action === 'accepted'
          ? `Your advance request for ${request.amount} was accepted.`
          : `Your advance request for ${request.amount} was rejected.`,
      link: '/dashboard/advance',
      entityId: request.id,
    });

    return this.repo.findOne({ where: { id } });
  }
}
