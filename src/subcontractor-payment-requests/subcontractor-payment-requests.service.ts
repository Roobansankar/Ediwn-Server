import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, type FindOptionsWhere } from 'typeorm';
import { SubcontractorPaymentRequest } from './entities/subcontractor-payment-request.entity.js';
import { CreateSubcontractorPaymentRequestDto } from './dto/create-subcontractor-payment-request.dto.js';
import { RespondSubcontractorPaymentRequestDto } from './dto/respond-subcontractor-payment-request.dto.js';
import { SubcontractorBill } from '../subcontractor-bills/entities/subcontractor-bill.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { BillStatus, Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class SubcontractorPaymentRequestsService {
  constructor(
    @InjectRepository(SubcontractorPaymentRequest)
    private repo: Repository<SubcontractorPaymentRequest>,
    private notifications: NotificationsService,
    @InjectRepository(SubcontractorBill)
    private billRepo: Repository<SubcontractorBill>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async create(dto: CreateSubcontractorPaymentRequestDto, userId: string) {
    const bill = await this.billRepo.findOne({
      where: { id: dto.subcontractorBillId, isDeleted: false },
    });
    if (!bill) throw new NotFoundException('Subcontractor bill not found');
    if (bill.status !== BillStatus.APPROVED)
      throw new BadRequestException(
        'The bill must be approved by accounts and admin before requesting payment',
      );
    if (
      bill.subcontractorId !== dto.subcontractorId ||
      bill.projectId !== dto.projectId ||
      (dto.subcontractWorkOrderId &&
        bill.subcontractWorkOrderId !== dto.subcontractWorkOrderId)
    )
      throw new BadRequestException(
        'Selected bill does not match the subcontractor, project and work order',
      );
    const legacy = bill.subcontractWorkOrderId
      ? await this.paymentRepo.find({
          where: {
            subcontractWorkOrderId: bill.subcontractWorkOrderId,
            subcontractorBillId: IsNull(),
            isDeleted: false,
          },
        })
      : [];
    const balance =
      Math.round(
        (Number(bill.amount) -
          Number(bill.paidAmount || 0) -
          legacy.reduce((sum, payment) => sum + Number(payment.amount), 0)) *
          100,
      ) / 100;
    if (!Number.isFinite(dto.amount) || dto.amount <= 0 || dto.amount > balance)
      throw new BadRequestException(
        'Requested amount cannot exceed the approved bill remaining balance',
      );
    const request = this.repo.create({
      subcontractorId: dto.subcontractorId,
      projectId: dto.projectId,
      subcontractWorkOrderId: bill.subcontractWorkOrderId || null,
      subcontractorBillId: bill.id,
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
      link: '/dashboard/approvals?tab=subcontractor',
      entityId: saved.id,
    });

    return saved;
  }

  async findAll(user: { id: string; role: Role }, status?: string) {
    const where: FindOptionsWhere<SubcontractorPaymentRequest> = {
      isDeleted: false,
    };
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
    userRole: Role,
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
    } else if (dto.action === 'accepted') {
      if (userRole !== Role.ACCOUNTS_MANAGER)
        throw new ForbiddenException(
          'Only accounts can give accounts approval',
        );
      if (request.status !== 'pending')
        throw new BadRequestException('Request already responded');
    } else {
      const canReject =
        (userRole === Role.ACCOUNTS_MANAGER && request.status === 'pending') ||
        (userRole === Role.ADMIN && request.status === 'accepted');
      if (!canReject)
        throw new BadRequestException(
          'Only the current approval stage can reject this request',
        );
    }

    // Admin fixes the final amount accounts will pay (defaults to the
    // requested amount).
    const approvedAmount =
      dto.action === 'admin_approved'
        ? Number(dto.approvedAmount ?? request.amount)
        : null;
    const rs = (n: number | string) =>
      `Rs. ${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const finalText =
      approvedAmount !== null
        ? approvedAmount !== Number(request.amount)
          ? ` Final amount to pay: ${rs(approvedAmount)} (requested ${rs(request.amount)}).`
          : ` Final amount to pay: ${rs(approvedAmount)}.`
        : '';

    await this.repo.update(id, {
      status: dto.action,
      respondedById: userId,
      respondedAt: new Date(),
      ...(approvedAmount !== null ? { approvedAmount } : {}),
    });

    const titles: Record<string, string> = {
      accepted: 'Payment Request Accepted by Accounts',
      admin_approved: 'Payment Request Approved by Admin',
      rejected: 'Payment Request Rejected',
    };
    const messages: Record<string, string> = {
      accepted: `Your subcontractor payment request for ${request.amount} was accepted by accounts — awaiting final admin approval.`,
      admin_approved: `Your subcontractor payment request for ${rs(request.amount)} received final admin approval.${finalText}`,
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
        link: '/dashboard/approvals?tab=subcontractor',
        entityId: request.id,
      });
    } else if (dto.action === 'admin_approved') {
      await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
        userId,
        type: 'subcontractor_payment_request_admin_approved',
        title: 'Subcontractor Payment Approved by Admin',
        message: `A subcontractor payment of ${rs(request.amount)} received final admin approval and is ready to be paid.${finalText}`,
        link: '/dashboard/payments?tab=subcontractor',
        entityId: request.id,
      });
    }

    return this.repo.findOne({ where: { id } });
  }
}
