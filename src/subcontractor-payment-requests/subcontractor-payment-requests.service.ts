import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubcontractorPaymentRequest } from './entities/subcontractor-payment-request.entity.js';
import { CreateSubcontractorPaymentRequestDto } from './dto/create-subcontractor-payment-request.dto.js';
import { RespondSubcontractorPaymentRequestDto } from './dto/respond-subcontractor-payment-request.dto.js';
import { Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class SubcontractorPaymentRequestsService {
  constructor(
    @InjectRepository(SubcontractorPaymentRequest)
    private repo: Repository<SubcontractorPaymentRequest>,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateSubcontractorPaymentRequestDto, userId: string) {
    const request = this.repo.create({
      subcontractorId: dto.subcontractorId,
      projectId: dto.projectId,
      subcontractWorkOrderId: dto.subcontractWorkOrderId || null,
      amount: dto.amount,
      notes: dto.notes || null,
      requestedById: userId,
      status: 'pending',
    });
    const saved = await this.repo.save(request);

    await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
      userId,
      type: 'subcontractor_payment_request',
      title: 'New Subcontractor Payment Request',
      message: `A subcontractor payment of ${dto.amount} was requested`,
      link: '/dashboard/subcontractor-payment-requests',
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

  async respond(
    id: string,
    dto: RespondSubcontractorPaymentRequestDto,
    userId: string,
    userRole: string,
  ) {
    const request = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!request) throw new NotFoundException('Payment request not found');

    if (dto.action === 'admin_approved') {
      if (userRole !== Role.ADMIN)
        throw new ForbiddenException('Only admin can give final approval');
      if (request.status !== 'accepted')
        throw new BadRequestException(
          'Request must be accepted by accounts before final admin approval',
        );
    } else if (request.status !== 'pending') {
      throw new BadRequestException('Request already responded');
    }

    await this.repo.update(id, {
      status: dto.action,
      respondedById: userId,
      respondedAt: new Date(),
    });

    const titles: Record<string, string> = {
      accepted: 'Payment Request Accepted by Accounts',
      admin_approved: 'Payment Request Approved by Admin',
      rejected: 'Payment Request Rejected',
    };
    const messages: Record<string, string> = {
      accepted: `Your subcontractor payment request for ${request.amount} was accepted by accounts — awaiting final admin approval.`,
      admin_approved: `Your subcontractor payment request for ${request.amount} received final admin approval.`,
      rejected: `Your subcontractor payment request for ${request.amount} was rejected.`,
    };
    await this.notifications.createForUser(request.requestedById, {
      userId,
      type: 'subcontractor_payment_request_response',
      title: titles[dto.action],
      message: messages[dto.action],
      link: '/dashboard/subcontractor-payments',
      entityId: request.id,
    });

    if (dto.action === 'accepted') {
      await this.notifications.createForRole(Role.ADMIN, {
        userId,
        type: 'subcontractor_payment_request_pending_approval',
        title: 'Subcontractor Payment Awaiting Your Approval',
        message: `A subcontractor payment of ${request.amount} was accepted by accounts and needs your final approval.`,
        link: '/dashboard/subcontractor-payment-requests',
        entityId: request.id,
      });
    } else if (dto.action === 'admin_approved') {
      await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
        userId,
        type: 'subcontractor_payment_request_admin_approved',
        title: 'Subcontractor Payment Approved by Admin',
        message: `A subcontractor payment of ${request.amount} received final admin approval and is ready to be paid.`,
        link: '/dashboard/subcontractor-payment-requests',
        entityId: request.id,
      });
    }

    return this.repo.findOne({ where: { id } });
  }
}
