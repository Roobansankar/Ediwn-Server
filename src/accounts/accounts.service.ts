import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesInvoice } from './entities/sales-invoice.entity.js';
import { InvoiceItem } from './entities/invoice-item.entity.js';
import { PurchaseBill } from './entities/purchase-bill.entity.js';
import { BoqItem } from './entities/boq-item.entity.js';
import { Advance } from './entities/advance.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { PoItem } from '../purchase-orders/entities/po-item.entity.js';
import { BillItem } from './entities/bill-item.entity.js';
import {
  CreateInvoiceDto,
  CreateBillDto,
  CreateAdvanceDto,
  CreateBoqDto,
} from './dto/accounts.dto.js';
import { InvoiceStatus, BillStatus, Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

type RequestUser = { id: string; role: string };

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(SalesInvoice)
    private invoiceRepo: Repository<SalesInvoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(PurchaseBill) private billRepo: Repository<PurchaseBill>,
    @InjectRepository(BoqItem) private boqRepo: Repository<BoqItem>,
    @InjectRepository(Advance) private advanceRepo: Repository<Advance>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PoItem) private poItemRepo: Repository<PoItem>,
    @InjectRepository(BillItem) private billItemRepo: Repository<BillItem>,
    private readonly notifications: NotificationsService,
  ) {}

  async convertPoToBill(poId: string, userId?: string): Promise<PurchaseBill> {
    const po = await this.poRepo.findOne({
      where: { id: poId },
      relations: ['vendor'],
    });
    if (!po) throw new NotFoundException('Purchase Order not found');

    const billNumber = await this.generateBillNumber();
    const bill = this.billRepo.create({
      vendorId: po.vendorId,
      projectId: po.projectId,
      amount: po.totalWithGst || po.totalAmount,
      gstPercent: po.gstPercent,
      gstAmount: po.gstAmount,
      billDate: new Date(),
      billNumber,
      createdBy: userId,
    });
    return this.billRepo.save(bill);
  }

  // --- Invoice ---
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.invoiceNumber LIKE :prefix', { prefix: `INV-${year}-%` })
      .orderBy('inv.invoiceNumber', 'DESC')
      .getOne();
    let seq = 1;
    if (last) {
      seq = parseInt(last.invoiceNumber.split('-')[2], 10) + 1;
    }
    return `INV-${year}-${String(seq).padStart(3, '0')}`;
  }

  async createInvoice(
    dto: CreateInvoiceDto,
    userId?: string,
  ): Promise<SalesInvoice> {
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const invoiceNumber = await this.generateInvoiceNumber();
    const items = dto.items.map((item) => {
      const amount = item.quantity * item.rate;
      return this.invoiceItemRepo.create({
        ...item,
        unit: item.unit || 'nos',
        amount,
      });
    });
    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const gstRate = 0.18;
    const gstAmount = totalAmount * gstRate;
    const companyState = 'Tamil Nadu';
    let cgstAmount = 0,
      sgstAmount = 0,
      igstAmount = 0;

    // Use project location as a proxy for state if needed
    const clientState = project.location || '';
    if (clientState.toLowerCase().includes(companyState.toLowerCase())) {
      cgstAmount = gstAmount / 2;
      sgstAmount = gstAmount / 2;
    } else {
      igstAmount = gstAmount;
    }

    const invoice = this.invoiceRepo.create({
      invoiceNumber,
      projectId: dto.projectId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      totalAmount,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      items,
      createdBy: userId,
    });
    return this.invoiceRepo.save(invoice);
  }

  async findInvoices(query: { status?: InvoiceStatus; projectId?: string }) {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.project', 'project')
      .leftJoinAndSelect('inv.items', 'items')
      .leftJoinAndSelect('inv.payments', 'payments')
      .where('inv.isDeleted = false');
    if (query.status)
      qb.andWhere('inv.status = :status', { status: query.status });
    if (query.projectId)
      qb.andWhere('inv.projectId = :projectId', { projectId: query.projectId });
    return qb.orderBy('inv.createdAt', 'DESC').getMany();
  }

  async findInvoice(id: string) {
    const invoice = await this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.project', 'project')
      .leftJoinAndSelect('inv.items', 'items')
      .leftJoinAndSelect('inv.payments', 'payments')
      .where('inv.id = :id', { id })
      .andWhere('inv.isDeleted = false')
      .getOne();
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    invoice.status = status;
    if (status === InvoiceStatus.PAID) invoice.paidAt = new Date();
    return this.invoiceRepo.save(invoice);
  }

  async removeInvoice(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    invoice.isDeleted = true;
    await this.invoiceRepo.save(invoice);
  }

  // --- Bills ---
  private async generateBillNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.billRepo
      .createQueryBuilder('bill')
      .where('bill.billNumber LIKE :prefix', { prefix: `BILL-${year}-%` })
      .orderBy('bill.billNumber', 'DESC')
      .getOne();
    let seq = 1;
    if (last) {
      seq = parseInt(last.billNumber.split('-')[2], 10) + 1;
    }
    return `BILL-${year}-${String(seq).padStart(3, '0')}`;
  }

  async createBill(dto: CreateBillDto, user?: RequestUser): Promise<PurchaseBill> {
    const billNumber = await this.generateBillNumber();
    const { items, ...billData } = dto;
    const bill = this.billRepo.create({
      ...billData,
      billNumber,
      createdBy: user?.id,
    });
    const savedBill = await this.billRepo.save(bill);

    if (items && items.length > 0) {
      const billItems: BillItem[] = [];
      for (const item of items) {
        const poItem = await this.poItemRepo.findOne({
          where: { id: item.poItemId },
        });
        if (poItem) {
          poItem.billedQuantity =
            Number(poItem.billedQuantity || 0) + Number(item.quantity);
          await this.poItemRepo.save(poItem);
        }
        billItems.push(
          this.billItemRepo.create({
            billId: savedBill.id,
            poItemId: item.poItemId,
            description: item.description || '',
            quantity: item.quantity,
            unit: item.unit || 'nos',
            rate: item.rate || 0,
            orderedQty: item.orderedQty || 0,
            billedQty: item.billedQty || 0,
          }),
        );
      }
      await this.billItemRepo.save(billItems);
    }

    if (user?.role === Role.PURCHASE_TEAM) {
      await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
        userId: user.id,
        type: 'bill_created',
        title: 'New Bill Created',
        message: `${savedBill.billNumber} was created`,
        link: '/dashboard/accounts/bills',
        entityId: savedBill.id,
      });
    }

    return this.findOneBill(savedBill.id);
  }

  async findOneBill(id: string): Promise<PurchaseBill> {
    const bill = await this.billRepo.findOne({
      where: { id },
      relations: [
        'vendor',
        'project',
        'payments',
        'purchaseOrder',
        'purchaseOrder.items',
        'billItems',
      ],
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  async findBills() {
    return this.billRepo.find({
      where: { isDeleted: false },
      relations: [
        'vendor',
        'project',
        'payments',
        'purchaseOrder',
        'purchaseOrder.items',
        'billItems',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async updateBill(
    id: string,
    dto: CreateBillDto,
    userId?: string,
  ): Promise<PurchaseBill> {
    const bill = await this.findOneBill(id);
    const { items, ...billData } = dto;
    Object.assign(bill, { ...billData, updatedBy: userId ?? '' });
    const savedBill = await this.billRepo.save(bill);

    if (items && items.length > 0) {
      await this.billItemRepo.delete({ billId: id });
      const billItems = items.map((item) =>
        this.billItemRepo.create({
          billId: id,
          poItemId: item.poItemId,
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit || 'nos',
          rate: item.rate || 0,
          orderedQty: item.orderedQty || 0,
          billedQty: item.billedQty || 0,
        }),
      );
      await this.billItemRepo.save(billItems);
    }
    return this.findOneBill(id);
  }

  async removeBill(id: string) {
    const bill = await this.billRepo.findOne({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    bill.isDeleted = true;
    await this.billRepo.save(bill);
  }

  async updateBillStatus(id: string, status: BillStatus) {
    const bill = await this.billRepo.findOne({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    bill.status = status;
    if (status === BillStatus.APPROVED) bill.paidAt = new Date();
    return this.billRepo.save(bill);
  }

  // --- BOQ ---
  async createBoq(dto: CreateBoqDto) {
    const boq = this.boqRepo.create({
      ...dto,
      estimatedAmount: (dto.estimatedQty || 0) * (dto.estimatedRate || 0),
    });
    return this.boqRepo.save(boq);
  }

  async findBoq(projectId: string) {
    return this.boqRepo.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });
  }

  // --- Advances ---
  async createAdvance(dto: CreateAdvanceDto, userId?: string) {
    const advance = this.advanceRepo.create({ ...dto, createdBy: userId });
    return this.advanceRepo.save(advance);
  }

  async findAdvances() {
    return this.advanceRepo.find({ order: { date: 'DESC' } });
  }

  // --- Ledger / Summary ---
  async getLedger() {
    // Derived transaction log from invoices and bills
    const invoices = await this.invoiceRepo.find({
      where: { isDeleted: false },
      relations: ['project'],
    });
    const bills = await this.billRepo.find({
      where: { isDeleted: false },
      relations: ['vendor'],
    });

    const ledger = [
      ...invoices.map((inv) => ({
        type: 'RECEIVABLE',
        refNumber: inv.invoiceNumber,
        party: inv.project?.clientName,
        amount: Number(inv.totalAmount) + Number(inv.gstAmount),
        date: inv.createdAt,
        status: inv.status,
      })),
      ...bills.map((bill) => ({
        type: 'PAYABLE',
        refNumber: bill.billNumber,
        party: bill.vendor?.name,
        amount: Number(bill.amount),
        date: bill.createdAt,
        status: bill.status,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return ledger;
  }

  async getPayables() {
    return this.billRepo.find({
      where: { isDeleted: false, paidAt: undefined },
      relations: ['vendor'],
    });
  }

  async getReceivables() {
    return this.invoiceRepo.find({
      where: [
        { isDeleted: false, status: InvoiceStatus.DRAFT },
        { isDeleted: false, status: InvoiceStatus.SENT },
        { isDeleted: false, status: InvoiceStatus.OVERDUE },
        { isDeleted: false, status: InvoiceStatus.PARTIAL },
      ],
      relations: ['project'],
    });
  }

  async getBalance() {
    const totalRevenue = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.totalAmount + inv.gstAmount)', 'total')
      .where('inv.isDeleted = false AND inv.status = :status', {
        status: InvoiceStatus.PAID,
      })
      .getRawOne();

    const totalCost = await this.billRepo
      .createQueryBuilder('bill')
      .select('SUM(bill.amount)', 'total')
      .where('bill.isDeleted = false')
      .getRawOne();

    return {
      totalRevenue: Number(totalRevenue?.total || 0),
      totalCost: Number(totalCost?.total || 0),
    };
  }
}
