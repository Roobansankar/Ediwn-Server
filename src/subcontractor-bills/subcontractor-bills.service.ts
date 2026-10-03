import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubcontractorBill } from './entities/subcontractor-bill.entity.js';
import { CreateSubcontractorBillDto } from './dto/create-subcontractor-bill.dto.js';
import { BillStatus, Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

type RequestUser = { id: string; role: string };

@Injectable()
export class SubcontractorBillsService {
  constructor(
    @InjectRepository(SubcontractorBill)
    private billRepo: Repository<SubcontractorBill>,
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
        link: '/dashboard/accounts/subcontractor-bills',
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

  // Document trail for a subcontractor bill: there's no MR/Enquiry/Material
  // Received equivalent for subcontract labour - the chain is simply the
  // Work Order that was billed. Kept as its own method (rather than inlined
  // in the frontend) so the bill-detail page can use the same shape as the
  // vendor-bill trail.
  async getBillTrail(id: string) {
    const bill = await this.findOne(id);
    return { bill, subcontractWorkOrder: bill.subcontractWorkOrder || null };
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

  async updateStatus(id: string, status: BillStatus): Promise<SubcontractorBill> {
    const bill = await this.findOne(id);
    bill.status = status;
    if (status === BillStatus.APPROVED) bill.paidAt = new Date();
    await this.billRepo.save(bill);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const bill = await this.findOne(id);
    bill.isDeleted = true;
    await this.billRepo.save(bill);
  }
}
