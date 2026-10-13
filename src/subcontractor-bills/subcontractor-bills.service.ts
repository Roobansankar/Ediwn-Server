import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubcontractorBill } from './entities/subcontractor-bill.entity.js';
import { CreateSubcontractorBillDto } from './dto/create-subcontractor-bill.dto.js';
import { BillStatus, Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SubcontractorEnquiry } from '../subcontractor-enquiries/entities/subcontractor-enquiry.entity.js';
import { SubcontractorWork } from '../subcontractor-work/entities/subcontractor-work.entity.js';

type RequestUser = { id: string; role: string };

@Injectable()
export class SubcontractorBillsService {
  constructor(
    @InjectRepository(SubcontractorBill)
    private billRepo: Repository<SubcontractorBill>,
    @InjectRepository(SubcontractorEnquiry)
    private enquiryRepo: Repository<SubcontractorEnquiry>,
    @InjectRepository(SubcontractorWork)
    private workRepo: Repository<SubcontractorWork>,
    private readonly notifications: NotificationsService,
  ) {}

  private async generateBillNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.billRepo
      .createQueryBuilder('bill')
      .where('bill.billNumber LIKE :prefix', { prefix: `SB-${year}-%` })
      .orderBy('bill.billNumber', 'DESC')
      .getOne();
    let seq = 1;
    if (last) {
      const parsed = parseInt(last.billNumber.split('-')[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
    return `SB-${year}-${String(seq).padStart(3, '0')}`;
  }

  async create(
    dto: CreateSubcontractorBillDto,
    user?: RequestUser,
  ): Promise<SubcontractorBill> {
    const billNumber = await this.generateBillNumber();
    const bill = this.billRepo.create({
      ...dto,
      billNumber,
      billDate: dto.billDate ? new Date(dto.billDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      createdBy: user?.id,
    });
    const saved = await this.billRepo.save(bill);

    if (user?.role === Role.PURCHASE_TEAM) {
      await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
        userId: user.id,
        type: 'subcontractor_bill_created',
        title: 'New Subcontractor Bill',
        message: `${saved.billNumber} was created`,
        link: '/dashboard/approvals?tab=subBills',
        entityId: saved.id,
      });
    }

    return this.findOne(saved.id);
  }

  async findAll() {
    return this.billRepo.find({
      where: { isDeleted: false },
      relations: ['subcontractor', 'project', 'subcontractWorkOrder', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SubcontractorBill> {
    const bill = await this.billRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['subcontractor', 'project', 'subcontractWorkOrder', 'payments'],
    });
    if (!bill) throw new NotFoundException('Subcontractor bill not found');
    return bill;
  }

  // The subcontractor's enquiry/quotation the bill's Work Order came from
  // (matched by the WO's SCR No + subcontractor), approved one first.
  private async findEnquiry(bill: SubcontractorBill) {
    const scrNo = bill.subcontractWorkOrder?.scrNo;
    if (!scrNo) return null;
    const enquiries = await this.enquiryRepo.find({
      where: { scrNo, subcontractorId: bill.subcontractorId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return enquiries.find((e) => e.status === 'approved') || enquiries[0] || null;
  }

  // Document trail for a subcontractor bill, the subcontract equivalent of
  // the vendor-bill trail: Enquiry (SCR) -> Work Order -> Bill, plus the
  // work-done entries logged against the Work Order.
  async getBillTrail(id: string) {
    const bill = await this.findOne(id);
    const wo = bill.subcontractWorkOrder || null;
    const scrNo = wo?.scrNo;
    const [enquiry, works, enquiries] = await Promise.all([
      this.findEnquiry(bill),
      wo
        ? this.workRepo.find({
            where: { subcontractWorkOrderId: wo.id, isDeleted: false },
            order: { createdAt: 'DESC' },
          })
        : Promise.resolve([]),
      // Every subcontractor quoted on the same SCR, for comparison.
      scrNo
        ? this.enquiryRepo.find({
            where: { scrNo, isDeleted: false },
            order: { createdAt: 'ASC' },
          })
        : Promise.resolve([]),
    ]);
    return { bill, subcontractWorkOrder: wo, enquiry, enquiries, works };
  }

  // Ticks the Enquiry (SCR) or Work Order as reviewed by accounts.
  async markDocumentChecked(id: string, document: string) {
    const flagByDocument: Record<string, 'enquiryChecked' | 'woChecked'> = {
      enquiry: 'enquiryChecked',
      workOrder: 'woChecked',
    };
    const flag = flagByDocument[document];
    if (!flag) throw new BadRequestException('Unknown document. Use enquiry or workOrder.');
    const bill = await this.findOne(id);
    bill[flag] = true;
    await this.billRepo.save(bill);
    return this.findOne(id);
  }

  async update(
    id: string,
    dto: Partial<CreateSubcontractorBillDto>,
    userId?: string,
  ): Promise<SubcontractorBill> {
    const bill = await this.findOne(id);
    Object.assign(bill, {
      ...dto,
      billDate: dto.billDate ? new Date(dto.billDate) : bill.billDate,
      dueDate:
        dto.dueDate === undefined ? bill.dueDate : dto.dueDate ? new Date(dto.dueDate) : null,
      updatedBy: userId ?? '',
    });
    await this.billRepo.save(bill);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: BillStatus, actor?: RequestUser): Promise<SubcontractorBill> {
    const bill = await this.findOne(id);

    // Same two-step flow as vendor bills: accounts sets Accounts Approved
    // (admin_approved) or Rejected; only admin gives the final Approved.
    if (status === BillStatus.APPROVED && actor && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can give final approval');
    }

    // Gate, same as vendor bills: accounts must check the documents before
    // Accounts Approving. The enquiry is only required when one exists.
    if (status === BillStatus.ADMIN_APPROVED) {
      const missing: string[] = [];
      if (bill.subcontractWorkOrderId && !bill.woChecked) missing.push('Work Order');
      if (!bill.enquiryChecked && (await this.findEnquiry(bill))) missing.push('Subcontractor Enquiry');
      if (missing.length) {
        throw new BadRequestException(
          `Check the documents on the bill page before approving. Still to check: ${missing.join(', ')}.`,
        );
      }
    }

    const previous = bill.status;
    bill.status = status;
    await this.billRepo.save(bill);

    if (actor && previous !== status) await this.notifyStatusChange(bill, status, actor);
    return this.findOne(id);
  }

  // Hand-offs between accounts and admin, plus the purchase team who raised
  // the bill - mirrors vendor bills.
  private async notifyStatusChange(bill: SubcontractorBill, status: BillStatus, actor: RequestUser) {
    const rs = (n: number | string) =>
      `Rs. ${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const label = `${bill.billNumber} (${rs(bill.amount)})`;
    const link = `/dashboard/accounts/subcontractor-bills/${bill.id}`;

    if (actor.role === Role.ACCOUNTS_MANAGER && status === BillStatus.ADMIN_APPROVED) {
      await this.notifications.createForRole(Role.ADMIN, {
        userId: actor.id,
        type: 'subcontractor_bill_accounts_approved',
        title: 'Subcontractor Bill Awaiting Your Approval',
        message: `${label} was approved by accounts and needs your final approval.`,
        link: '/dashboard/approvals?tab=subBills',
        entityId: bill.id,
      });
    }

    if (actor.role === Role.ADMIN && (status === BillStatus.APPROVED || status === BillStatus.REJECTED)) {
      const approved = status === BillStatus.APPROVED;
      await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
        userId: actor.id,
        type: approved ? 'subcontractor_bill_admin_approved' : 'subcontractor_bill_admin_rejected',
        title: approved ? 'Subcontractor Bill Approved by Admin' : 'Subcontractor Bill Rejected by Admin',
        message: `${label} was ${approved ? 'given final approval' : 'rejected'} by admin.`,
        link: '/dashboard/approvals?tab=subBills',
        entityId: bill.id,
      });
    }

    if ([BillStatus.ADMIN_APPROVED, BillStatus.APPROVED, BillStatus.REJECTED].includes(status)) {
      const who = actor.role === Role.ADMIN ? 'admin' : 'accounts';
      const outcome = status === BillStatus.REJECTED ? 'rejected' : 'approved';
      const input = {
        userId: actor.id,
        type: `subcontractor_bill_${outcome}_for_purchase`,
        title: status === BillStatus.REJECTED ? 'Subcontractor Bill Rejected' : 'Subcontractor Bill Approved',
        message: `${label} was ${outcome} by ${who}${status === BillStatus.ADMIN_APPROVED ? ' and is waiting for admin approval' : ''}.`,
        link,
        entityId: bill.id,
      };
      if (bill.createdBy) await this.notifications.createForUser(bill.createdBy, input);
      else await this.notifications.createForRole(Role.PURCHASE_TEAM, input);
    }
  }

  async remove(id: string): Promise<void> {
    const bill = await this.findOne(id);
    bill.isDeleted = true;
    await this.billRepo.save(bill);
  }
}
