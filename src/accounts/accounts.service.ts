import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { SalesInvoice } from './entities/sales-invoice.entity.js';
import { InvoiceItem } from './entities/invoice-item.entity.js';
import { PurchaseBill } from './entities/purchase-bill.entity.js';
import { BoqItem } from './entities/boq-item.entity.js';
import { Advance } from './entities/advance.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { PoItem } from '../purchase-orders/entities/po-item.entity.js';
import { BillItem } from './entities/bill-item.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { PurchaseEnquiry } from '../purchase-enquiries/entities/purchase-enquiry.entity.js';
import { VendorQuotation } from '../vendor-quotations/entities/vendor-quotation.entity.js';
import { MaterialReceived } from '../material-received/entities/material-received.entity.js';
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
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(PurchaseEnquiry)
    private purchaseEnquiryRepo: Repository<PurchaseEnquiry>,
    @InjectRepository(VendorQuotation)
    private vendorQuotationRepo: Repository<VendorQuotation>,
    @InjectRepository(MaterialReceived)
    private materialReceivedRepo: Repository<MaterialReceived>,
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
    const items = (dto.items || []).map((item) => {
      const amount = item.quantity * item.rate;
      return this.invoiceItemRepo.create({
        ...item,
        unit: item.unit || 'nos',
        amount,
      });
    });
    // A directly entered invoice amount is the GST-INCLUSIVE total the client
    // is billed. Split it into base + GST rather than adding GST on top again.
    const gstRate = 0.18;
    let totalAmount: number;
    let gstAmount: number;
    if (dto.totalAmount != null) {
      totalAmount = Math.round((Number(dto.totalAmount) / (1 + gstRate)) * 100) / 100;
      gstAmount = Math.round((Number(dto.totalAmount) - totalAmount) * 100) / 100;
    } else {
      totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
      gstAmount = totalAmount * gstRate;
    }
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
        link: '/dashboard/approvals?tab=bills',
        entityId: savedBill.id,
      });
    }

    return this.findOneBill(savedBill.id);
  }

  async findOneBill(id: string): Promise<PurchaseBill> {
    const [withPo] = await this.attachPoPayments([await this.loadBill(id)]);
    return withPo;
  }

  // Bill as stored, without PO payments added - use before saving it.
  private async loadBill(id: string): Promise<PurchaseBill> {
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

  // Vendor payments made through a vendor payment request are recorded
  // against the PO, not the bill. Count those PO payments on the PO's bills
  // too (payments list + paidAmount), so the Bills page, bill detail and
  // reports show what the vendor has actually been paid. Not persisted.
  private async attachPoPayments(bills: PurchaseBill[]): Promise<PurchaseBill[]> {
    const poIds = [...new Set(bills.map((b) => b.purchaseOrderId).filter(Boolean))] as string[];
    if (!poIds.length) return bills;
    const poPayments = await this.paymentRepo.find({
      where: { purchaseOrderId: In(poIds), purchaseBillId: IsNull() },
      order: { paymentDate: 'ASC' },
    });
    if (!poPayments.length) return bills;
    for (const bill of bills) {
      if (!bill.purchaseOrderId) continue;
      const extra = poPayments.filter((p) => p.purchaseOrderId === bill.purchaseOrderId);
      if (!extra.length) continue;
      bill.payments = [...(bill.payments || []), ...extra];
      bill.paidAmount =
        Number(bill.paidAmount || 0) +
        extra.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }
    return bills;
  }

  // Full procurement trail for one bill, walking backwards from its PO:
  // Material Requirement (by PO.materialRequirementNo) -> the vendor's
  // Quotation/Enquiry against that MR -> Material Received against the PO.
  // Used to show the MR -> Enquiry -> PO -> Material Received -> Bill chain
  // on the bill detail page.
  async getBillTrail(id: string) {
    const bill = await this.findOneBill(id);
    const po = bill.purchaseOrder;

    let materialRequirement: PurchaseEnquiry | null = null;
    let vendorQuotation: VendorQuotation | null = null;
    let materialReceived: MaterialReceived[] = [];
    // Every vendor's quotation against the same MR, for the enquiry comparison.
    let quotations: VendorQuotation[] = [];

    if (po?.materialRequirementNo) {
      materialRequirement = await this.purchaseEnquiryRepo.findOne({
        where: { enquiryNo: po.materialRequirementNo, isDeleted: false },
        // creator = the site engineer who raised the MR, shown on the bill page.
        relations: ['project', 'creator'],
      });

      if (materialRequirement) {
        vendorQuotation = await this.vendorQuotationRepo.findOne({
          where: {
            materialRequirementId: materialRequirement.id,
            vendorId: po.vendorId,
            isDeleted: false,
          },
          order: { createdAt: 'DESC' },
        });
        quotations = await this.vendorQuotationRepo.find({
          where: { materialRequirementId: materialRequirement.id, isDeleted: false },
          order: { createdAt: 'ASC' },
        });
      }
    }

    if (po?.id) {
      materialReceived = await this.materialReceivedRepo.find({
        where: { purchaseOrderId: po.id, isDeleted: false },
        order: { createdAt: 'DESC' },
      });
    }

    return { bill, materialRequirement, vendorQuotation, quotations, materialReceived };
  }

  async findBills() {
    const bills = await this.billRepo.find({
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
    return this.attachPoPayments(bills);
  }

  // Purchase team may only change or delete a bill while it is still pending;
  // once accounts has acted on it, only admin / accounts can.
  private assertPurchaseTeamCanChange(bill: PurchaseBill, role?: string) {
    if (role === Role.PURCHASE_TEAM && bill.status !== BillStatus.PENDING) {
      throw new ForbiddenException('This bill has already been reviewed by accounts and can no longer be changed');
    }
  }

  async updateBill(
    id: string,
    dto: CreateBillDto,
    userId?: string,
    role?: string,
  ): Promise<PurchaseBill> {
    const bill = await this.loadBill(id);
    this.assertPurchaseTeamCanChange(bill, role);
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

  async removeBill(id: string, role?: string) {
    const bill = await this.billRepo.findOne({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    this.assertPurchaseTeamCanChange(bill, role);
    bill.isDeleted = true;
    await this.billRepo.save(bill);
  }

  // Ticks one of the three documents (MRR / Purchase Enquiry / PO) as opened
  // and checked for this bill.
  async markBillDocumentChecked(id: string, document: string) {
    const flagByDocument: Record<string, 'mrrChecked' | 'enquiryChecked' | 'poChecked'> = {
      mrr: 'mrrChecked',
      enquiry: 'enquiryChecked',
      po: 'poChecked',
    };
    const flag = flagByDocument[document];
    if (!flag) throw new BadRequestException('Unknown document. Use mrr, enquiry or po.');
    const bill = await this.billRepo.findOne({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    bill[flag] = true;
    return this.billRepo.save(bill);
  }

  async updateBillStatus(id: string, status: BillStatus, actor?: { id: string; role: string }) {
    const bill = await this.billRepo.findOne({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');

    // Approved is the final admin approval; accounts stops at Accounts Approved.
    if (status === BillStatus.APPROVED && actor && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can give final approval');
    }

    // Gate: a bill can only be accounts-approved once all three documents
    // have been opened and checked.
    if (status === BillStatus.ADMIN_APPROVED) {
      const missing: string[] = [];
      if (!bill.mrrChecked) missing.push('MRR');
      if (!bill.enquiryChecked) missing.push('Purchase Enquiry');
      if (!bill.poChecked) missing.push('Purchase Order');
      if (missing.length) {
        throw new BadRequestException(
          `Check all three documents before approving. Still to check: ${missing.join(', ')}.`,
        );
      }
    }

    const previous = bill.status;
    bill.status = status;
    if (status === BillStatus.APPROVED) bill.paidAt = new Date();
    const saved = await this.billRepo.save(bill);

    // Hand-offs between accounts and admin.
    if (actor && previous !== status) {
      if (actor.role === Role.ACCOUNTS_MANAGER && status === BillStatus.ADMIN_APPROVED) {
        await this.notifications.createForRole(Role.ADMIN, {
          userId: actor.id,
          type: 'bill_accounts_approved',
          title: 'Bill Awaiting Your Approval',
          message: `${bill.billNumber} (${bill.amount}) was approved by accounts and needs your final approval.`,
          link: '/dashboard/approvals?tab=bills',
          entityId: bill.id,
        });
      }
      // Purchase team (whoever raised the bill, or the whole team if unknown)
      // hears about every approval or rejection, by accounts or admin.
      if ([BillStatus.ADMIN_APPROVED, BillStatus.APPROVED, BillStatus.REJECTED].includes(status)) {
        const who = actor.role === Role.ADMIN ? 'admin' : 'accounts';
        const outcome = status === BillStatus.REJECTED ? 'rejected' : 'approved';
        const input = {
          userId: actor.id,
          type: `bill_${outcome}_for_purchase`,
          title: status === BillStatus.REJECTED ? 'Purchase Bill Rejected' : 'Purchase Bill Approved',
          message: `${bill.billNumber} (${bill.amount}) was ${outcome} by ${who}${status === BillStatus.ADMIN_APPROVED ? ' and is waiting for admin approval' : ''}.`,
          link: `/dashboard/accounts/bills/${bill.id}`,
          entityId: bill.id,
        };
        if (bill.createdBy) await this.notifications.createForUser(bill.createdBy, input);
        else await this.notifications.createForRole(Role.PURCHASE_TEAM, input);
      }

      if (actor.role === Role.ADMIN && (status === BillStatus.APPROVED || status === BillStatus.REJECTED)) {
        const approved = status === BillStatus.APPROVED;
        await this.notifications.createForRole(Role.ACCOUNTS_MANAGER, {
          userId: actor.id,
          type: approved ? 'bill_admin_approved' : 'bill_admin_rejected',
          title: approved ? 'Bill Approved by Admin' : 'Bill Rejected by Admin',
          message: `${bill.billNumber} (${bill.amount}) was ${approved ? 'given final approval' : 'rejected'} by admin.`,
          link: '/dashboard/approvals?tab=bills',
          entityId: bill.id,
        });
      }
    }

    return saved;
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
    // Payables is driven entirely off Purchase Orders — a PO is the money
    // owed to a vendor, so Purchase Bills are not listed here separately.
    const purchaseOrders = await this.poRepo.find({
      where: { isDeleted: false },
      relations: ['vendor', 'project'],
    });
    const paidRows = purchaseOrders.length
      ? await this.paymentRepo
          .createQueryBuilder('p')
          .select('p.purchaseOrderId', 'purchaseOrderId')
          .addSelect('SUM(p.amount)', 'total')
          .where('p.isDeleted = false')
          .andWhere('p.purchaseOrderId IN (:...ids)', {
            ids: purchaseOrders.map((po) => po.id),
          })
          .groupBy('p.purchaseOrderId')
          .getRawMany<{ purchaseOrderId: string; total: string }>()
      : [];
    const paidByPo = new Map(
      paidRows.map((r) => [r.purchaseOrderId, Number(r.total)]),
    );

    const poPayables = purchaseOrders
      .map((po) => {
        const amount = Number(po.totalWithGst || po.totalAmount || 0);
        const paidAmount = paidByPo.get(po.id) || 0;
        return {
          id: po.id,
          source: 'purchase_order' as const,
          billNumber: po.poNumber,
          vendor: po.vendor,
          project: po.project,
          billDate: po.createdAt,
          dueDate: null,
          amount,
          paidAmount,
          status: po.status,
        };
      })
      .filter((po) => po.amount - po.paidAmount > 0);

    return poPayables;
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
