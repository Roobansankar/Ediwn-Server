import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, type FindOptionsWhere } from 'typeorm';
import { AdvanceRequest } from './entities/advance-request.entity.js';
import { CreateAdvanceRequestDto } from './dto/create-advance-request.dto.js';
import { RespondAdvanceRequestDto } from './dto/respond-advance-request.dto.js';
import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { BillStatus, Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PurchaseEnquiry } from '../purchase-enquiries/entities/purchase-enquiry.entity.js';
import { VendorQuotation } from '../vendor-quotations/entities/vendor-quotation.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';

@Injectable()
export class AdvanceRequestsService {
  constructor(
    @InjectRepository(AdvanceRequest)
    private repo: Repository<AdvanceRequest>,
    @InjectRepository(PurchaseEnquiry)
    private purchaseEnquiryRepo: Repository<PurchaseEnquiry>,
    @InjectRepository(VendorQuotation)
    private vendorQuotationRepo: Repository<VendorQuotation>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    private notifications: NotificationsService,
    @InjectRepository(PurchaseBill)
    private billRepo: Repository<PurchaseBill>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  // Full journey behind one vendor payment request: the material requirement
  // (MR), every vendor quotation raised against it (the purchase enquiry
  // comparison), and the purchase order with its items.
  async getTrail(id: string, user: { id: string; role: Role }) {
    const request = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!request)
      throw new NotFoundException('Vendor payment request not found');
    if (
      user.role !== Role.ADMIN &&
      user.role !== Role.ACCOUNTS_MANAGER &&
      request.requestedById !== user.id
    ) {
      throw new ForbiddenException('You can only view your own requests');
    }

    const purchaseOrder = request.purchaseOrderId
      ? await this.purchaseOrderRepo.findOne({
          where: { id: request.purchaseOrderId },
          relations: ['project', 'vendor', 'items'],
        })
      : null;

    const mrNo =
      request.materialRequirementNo ||
      purchaseOrder?.materialRequirementNo ||
      null;
    const materialRequirement = mrNo
      ? await this.purchaseEnquiryRepo.findOne({
          where: { enquiryNo: mrNo, isDeleted: false },
          relations: ['project', 'creator'],
        })
      : null;

    const quotations = materialRequirement
      ? await this.vendorQuotationRepo.find({
          where: {
            materialRequirementId: materialRequirement.id,
            isDeleted: false,
          },
          order: { createdAt: 'ASC' },
        })
      : [];

    return { request, materialRequirement, quotations, purchaseOrder };
  }

  async create(dto: CreateAdvanceRequestDto, userId: string) {
    const bill = await this.billRepo.findOne({
      where: { id: dto.purchaseBillId, isDeleted: false },
    });
    if (!bill) throw new NotFoundException('Purchase bill not found');
    if (bill.status !== BillStatus.APPROVED)
      throw new BadRequestException(
        'The bill must be approved by accounts and admin before requesting payment',
      );
    if (
      bill.vendorId !== dto.vendorId ||
      bill.projectId !== dto.projectId ||
      (dto.purchaseOrderId && bill.purchaseOrderId !== dto.purchaseOrderId)
    )
      throw new BadRequestException(
        'Selected bill does not match the vendor, project and purchase order',
      );
    const legacyPayments = bill.purchaseOrderId
      ? await this.paymentRepo.find({
          where: {
            purchaseOrderId: bill.purchaseOrderId,
            purchaseBillId: IsNull(),
            isDeleted: false,
          },
        })
      : [];
    const paid =
      Number(bill.paidAmount || 0) +
      legacyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const balance = Math.round((Number(bill.amount) - paid) * 100) / 100;
    if (!Number.isFinite(dto.amount) || dto.amount <= 0 || dto.amount > balance)
      throw new BadRequestException(
        'Requested amount cannot exceed the approved bill remaining balance',
      );
    const request = this.repo.create({
      vendorId: dto.vendorId,
      projectId: dto.projectId,
      materialRequirementNo: dto.materialRequirementNo || null,
      vendorQuotationId: dto.vendorQuotationId || null,
      purchaseOrderId: bill.purchaseOrderId || null,
      purchaseBillId: bill.id,
      amount: dto.amount,
      notes: dto.notes || null,
      requestedById: userId,
      status: 'pending',
    });
    const saved = await this.repo.save(request);

    await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
      userId,
      type: 'advance_request',
      title: 'New Vendor Payment Request',
      message: `A vendor payment of ${dto.amount} was requested${dto.materialRequirementNo ? ` for ${dto.materialRequirementNo}` : ''}`,
      link: '/dashboard/approvals?tab=vendor',
      entityId: saved.id,
    });

    return saved;
  }

  async findAll(user: { id: string; role: Role }, status?: string) {
    const where: FindOptionsWhere<AdvanceRequest> = { isDeleted: false };
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
    dto: RespondAdvanceRequestDto,
    userId: string,
    userRole: Role,
  ) {
    const request = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!request) throw new NotFoundException('Advance request not found');

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
      approvedAmount !== null && approvedAmount !== Number(request.amount)
        ? ` Final amount to pay: ${rs(approvedAmount)} (requested ${rs(request.amount)}).`
        : '';

    await this.repo.update(id, {
      status: dto.action,
      respondedById: userId,
      respondedAt: new Date(),
      ...(approvedAmount !== null ? { approvedAmount } : {}),
    });

    const titles: Record<string, string> = {
      accepted: 'Vendor Payment Request Accepted by Accounts',
      admin_approved: 'Vendor Payment Request Approved by Admin',
      rejected: 'Vendor Payment Request Rejected',
    };
    const messages: Record<string, string> = {
      accepted: `Your vendor payment request for ${request.amount} was accepted by accounts — awaiting final admin approval.`,
      admin_approved: `Your vendor payment request for ${rs(request.amount)} received final admin approval.${finalText || ` Final amount to pay: ${rs(approvedAmount ?? request.amount)}.`}`,
      rejected: `Your vendor payment request for ${request.amount} was rejected.`,
    };
    await this.notifications.createForUser(request.requestedById, {
      userId,
      type: 'advance_request_response',
      title: titles[dto.action],
      message: messages[dto.action],
      link: '/dashboard/advance',
      entityId: request.id,
    });

    if (dto.action === 'accepted') {
      await this.notifications.createForRole(Role.ADMIN, {
        userId,
        type: 'advance_request_pending_approval',
        title: 'Vendor Payment Awaiting Your Approval',
        message: `A vendor payment of ${request.amount} was accepted by accounts and needs your final approval.`,
        link: '/dashboard/approvals?tab=vendor',
        entityId: request.id,
      });
    } else if (dto.action === 'admin_approved') {
      await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
        userId,
        type: 'advance_request_admin_approved',
        title: 'Vendor Payment Approved by Admin',
        message: `A vendor payment of ${rs(request.amount)} received final admin approval and is ready to be paid.${finalText || ` Final amount to pay: ${rs(approvedAmount ?? request.amount)}.`}`,
        link: '/dashboard/payments?tab=vendor',
        entityId: request.id,
      });
    }

    return this.repo.findOne({ where: { id } });
  }
}
