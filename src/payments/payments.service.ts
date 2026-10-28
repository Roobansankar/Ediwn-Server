import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Payment } from './entities/payment.entity.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import {
  PaymentType,
  BillStatus,
  ExpenseCategory,
  PaymentMode,
  InvoiceStatus,
  ExpenseStatus,
  Role,
} from '../common/enums.js';
import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { SubcontractorBill } from '../subcontractor-bills/entities/subcontractor-bill.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { SalesInvoice } from '../accounts/entities/sales-invoice.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { SubcontractWorkOrder } from '../subcontract-work-orders/entities/subcontract-work-order.entity.js';
import { AdvanceRequest } from '../advance-requests/entities/advance-request.entity.js';
import { SubcontractorPaymentRequest } from '../subcontractor-payment-requests/entities/subcontractor-payment-request.entity.js';
import { User } from '../users/entities/user.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(PurchaseBill) private billRepo: Repository<PurchaseBill>,
    @InjectRepository(SubcontractorBill)
    private subcontractorBillRepo: Repository<SubcontractorBill>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreatePaymentDto, userId?: string): Promise<Payment> {
    return await this.dataSource.transaction(async (manager) => {
      let projectId = dto.projectId;
      let vendorId = dto.vendorId;
      let payeeName = dto.payeeName;

      const advanceRequest = dto.advanceRequestId
          ? await manager.findOne(AdvanceRequest, {
              where: { id: dto.advanceRequestId, isDeleted: false },
              loadEagerRelations: false,
              lock: { mode: 'pessimistic_write' },
            })
          : null;
        if (dto.advanceRequestId && !advanceRequest)
          throw new NotFoundException('Vendor payment request not found');
        if (advanceRequest && advanceRequest.status !== 'admin_approved')
          throw new BadRequestException(
            'This vendor payment request has not received final admin approval yet',
          );
        if (
          advanceRequest?.purchaseBillId &&
          dto.purchaseBillId &&
          dto.purchaseBillId !== advanceRequest.purchaseBillId
        )
          throw new BadRequestException(
            'Payment bill does not match the approved request',
          );
        const purchaseBillId =
          advanceRequest?.purchaseBillId || dto.purchaseBillId;
        if (advanceRequest) {
          projectId = advanceRequest.projectId;
          vendorId = advanceRequest.vendorId;
          const previous = await manager.find(Payment, {
            where: { advanceRequestId: advanceRequest.id, isDeleted: false },
          });
          const balance =
            Number(advanceRequest.approvedAmount ?? advanceRequest.amount) -
            previous.reduce((sum, payment) => sum + Number(payment.amount), 0);
          if (Number(dto.amount) > Math.round(balance * 100) / 100)
            throw new BadRequestException(
              'Payment exceeds the approved request remaining balance',
            );
        }

        if (purchaseBillId) {
          const bill = await manager.findOne(PurchaseBill, {
            where: { id: purchaseBillId, isDeleted: false },
            loadEagerRelations: false,
            lock: { mode: 'pessimistic_write' },
          });
          if (!bill) throw new NotFoundException('Purchase Bill not found');
          if (advanceRequest?.purchaseBillId) {
            if (bill.status !== BillStatus.APPROVED)
              throw new BadRequestException(
                'The bill must have final admin approval before payment',
              );
            if (
              dto.purchaseOrderId &&
              bill.purchaseOrderId !== dto.purchaseOrderId
            )
              throw new BadRequestException(
                'Purchase order does not match the approved bill',
              );
            const legacy = bill.purchaseOrderId
              ? await manager.find(Payment, {
                  where: {
                    purchaseOrderId: bill.purchaseOrderId,
                    purchaseBillId: IsNull(),
                    isDeleted: false,
                  },
                })
              : [];
            const balance =
              Number(bill.amount) -
              Number(bill.paidAmount || 0) -
              legacy.reduce((sum, payment) => sum + Number(payment.amount), 0);
            if (Number(dto.amount) > Math.round(balance * 100) / 100)
              throw new BadRequestException(
                'Payment exceeds the approved bill remaining balance',
              );
          }

          projectId = bill.projectId;
          vendorId = bill.vendorId;

          // Update bill paid amount
          const newPaidAmount = Number(bill.paidAmount) + Number(dto.amount);
          bill.paidAmount = newPaidAmount;

          if (newPaidAmount >= Number(bill.amount)) {
            bill.paidAt = new Date();
          }

          await manager.save(bill);
        }

        if (dto.purchaseOrderId) {
        const po = await manager.findOne(PurchaseOrder, {
          where: { id: dto.purchaseOrderId },
        });
        if (!po) throw new NotFoundException('Purchase Order not found');

        if (!projectId) projectId = po.projectId;
        if (!vendorId) vendorId = po.vendorId;
      }

      if (dto.subcontractWorkOrderId) {
        const swo = await manager.findOne(SubcontractWorkOrder, {
          where: { id: dto.subcontractWorkOrderId },
          relations: ['subcontractor'],
        });
        if (!swo) throw new NotFoundException('Subcontract Work Order not found');

        if (!projectId) projectId = swo.projectId;
        if (!payeeName) payeeName = swo.subcontractor?.name;
      }

      const subcontractorRequest = dto.subcontractorPaymentRequestId ? await manager.findOne(SubcontractorPaymentRequest, {
        where: { id: dto.subcontractorPaymentRequestId, isDeleted: false },
        loadEagerRelations: false, lock: { mode: 'pessimistic_write' },
      }) : null;
      if (dto.subcontractorPaymentRequestId && !subcontractorRequest)
        throw new NotFoundException('Subcontractor payment request not found');
      if (subcontractorRequest && subcontractorRequest.status !== 'admin_approved')
        throw new BadRequestException('This subcontractor payment request has not received final admin approval yet');
      if (subcontractorRequest?.subcontractorBillId && dto.subcontractorBillId && dto.subcontractorBillId !== subcontractorRequest.subcontractorBillId)
        throw new BadRequestException('Payment bill does not match the approved request');
      const subcontractorBillId = subcontractorRequest?.subcontractorBillId || dto.subcontractorBillId;
      if (subcontractorRequest) {
        projectId = subcontractorRequest.projectId;
        const previous = await manager.find(Payment, { where: { subcontractorPaymentRequestId: subcontractorRequest.id, isDeleted: false } });
        const balance = Number(subcontractorRequest.approvedAmount ?? subcontractorRequest.amount) - previous.reduce((sum, payment) => sum + Number(payment.amount), 0);
        if (Number(dto.amount) > Math.round(balance * 100) / 100)
          throw new BadRequestException('Payment exceeds the approved request remaining balance');
      }
      if (subcontractorBillId) {
        const bill = await manager.findOne(SubcontractorBill, {
          where: { id: subcontractorBillId, isDeleted: false },
          loadEagerRelations: false, lock: { mode: 'pessimistic_write' },
          relations: ['subcontractor'],
        });
        if (!bill) throw new NotFoundException('Subcontractor bill not found');
        if (subcontractorRequest?.subcontractorBillId) {
          if (bill.status !== BillStatus.APPROVED)
            throw new BadRequestException('The bill must have final admin approval before payment');
          if (dto.subcontractWorkOrderId && bill.subcontractWorkOrderId !== dto.subcontractWorkOrderId)
            throw new BadRequestException('Work order does not match the approved bill');
          const legacy = bill.subcontractWorkOrderId ? await manager.find(Payment, {
            where: { subcontractWorkOrderId: bill.subcontractWorkOrderId, subcontractorBillId: IsNull(), isDeleted: false },
          }) : [];
          const balance = Number(bill.amount) - Number(bill.paidAmount || 0) - legacy.reduce((sum, payment) => sum + Number(payment.amount), 0);
          if (Number(dto.amount) > Math.round(balance * 100) / 100)
            throw new BadRequestException('Payment exceeds the approved bill remaining balance');
        }


        if (!projectId) projectId = bill.projectId;
        if (!payeeName) payeeName = bill.subcontractor?.name;

        // Update bill paid amount - same running-total pattern as purchaseBillId.
        const newPaidAmount = Number(bill.paidAmount) + Number(dto.amount);
        bill.paidAmount = newPaidAmount;

        if (newPaidAmount >= Number(bill.amount)) {
          bill.paidAt = new Date();
        }

        await manager.save(bill);
      }

      if (dto.salesInvoiceId) {
        const invoice = await manager.findOne(SalesInvoice, {
          where: { id: dto.salesInvoiceId },
        });
        if (!invoice) throw new NotFoundException('Sales Invoice not found');

        projectId = invoice.projectId;

        // Update invoice status and amount
        const newPaidAmount =
          Number(invoice.paidAmount || 0) + Number(dto.amount);
        invoice.paidAmount = newPaidAmount;

        const totalExpected =
          Number(invoice.totalAmount) + Number(invoice.gstAmount);

        if (newPaidAmount >= totalExpected) {
          invoice.status = InvoiceStatus.PAID;
          invoice.paidAt = new Date();
        } else if (newPaidAmount > 0) {
          invoice.status = InvoiceStatus.PARTIAL;
        }

        await manager.save(invoice);
      }

      const payment = manager.create(Payment, {
        ...dto,
        purchaseBillId,
        subcontractorBillId,
        projectId,
        vendorId,
        payeeName,
        createdBy: userId,
      });

      return await manager.save(payment);
    }).then(async (payment) => {
      if (!dto.salesInvoiceId && payment.projectId) {
        await this.notifyPaymentRecorded(payment, userId);
      }
      return payment;
    });
  }

  private async notifyPaymentRecorded(payment: Payment, userId?: string) {
    const context = payment.vendorId
      ? ' for a vendor'
      : payment.subcontractWorkOrderId || payment.subcontractorPaymentRequestId
        ? ' for a subcontractor'
        : '';
    await this.notifications.createForRole(Role.PURCHASE_TEAM, {
      userId,
      type: 'payment_recorded',
      title: 'Payment Recorded',
      message: `A payment of ${payment.amount} was recorded${context}.`,
      // Purchase team can't open /dashboard/payments; use their own pages.
      link:
        payment.subcontractWorkOrderId || payment.subcontractorPaymentRequestId
          ? '/dashboard/subcontractor-payments'
          : '/dashboard/advance',
      entityId: payment.id,
    });

    const siteEngineers = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.projects', 'p', 'p.id = :projectId', { projectId: payment.projectId })
      .where('u.role = :role', { role: Role.SITE_ENGINEER })
      .andWhere('u.isActive = true')
      .getMany();

    for (const se of siteEngineers) {
      await this.notifications.createForUser(se.id, {
        userId,
        type: 'payment_recorded',
        title: 'Payment Recorded',
        message: `A payment of ${payment.amount} was recorded for your project.`,
        link: '/dashboard/material-requirement',
        entityId: payment.id,
      });
    }
  }

  async findAll(query: {
    type?: PaymentType;
    projectId?: string;
    purchaseOrderId?: string;
    subcontractWorkOrderId?: string;
    advanceRequestId?: string;
    subcontractorPaymentRequestId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, projectId, purchaseOrderId, subcontractWorkOrderId, advanceRequestId, subcontractorPaymentRequestId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const qb = this.paymentsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.project', 'project')
      .leftJoinAndSelect('p.vendor', 'vendor')
      .leftJoinAndSelect('p.purchaseBill', 'purchaseBill')
      .leftJoinAndSelect('p.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('p.subcontractWorkOrder', 'subcontractWorkOrder')
      .leftJoinAndSelect('subcontractWorkOrder.subcontractor', 'swoSubcontractor')
      .leftJoinAndSelect('p.advanceRequest', 'advanceRequest')
      .leftJoinAndSelect('p.subcontractorPaymentRequest', 'subcontractorPaymentRequest')
      .leftJoinAndSelect('p.expense', 'expense')
      .leftJoinAndSelect('p.salesInvoice', 'salesInvoice')
      .leftJoinAndSelect('salesInvoice.project', 'invoiceProject')
      .where('p.isDeleted = false')
      .andWhere('(expense.isDeleted = false OR expense.isDeleted IS NULL)')
      .andWhere('(expense.status = :approved OR expense.status IS NULL)', {
        approved: 'approved',
      });
    if (type) qb.andWhere('p.paymentType = :type', { type });
    if (projectId) qb.andWhere('p.projectId = :projectId', { projectId });
    if (purchaseOrderId) qb.andWhere('p.purchaseOrderId = :purchaseOrderId', { purchaseOrderId });
    if (subcontractWorkOrderId) qb.andWhere('p.subcontractWorkOrderId = :subcontractWorkOrderId', { subcontractWorkOrderId });
    if (advanceRequestId) qb.andWhere('p.advanceRequestId = :advanceRequestId', { advanceRequestId });
    if (subcontractorPaymentRequestId) qb.andWhere('p.subcontractorPaymentRequestId = :subcontractorPaymentRequestId', { subcontractorPaymentRequestId });
    if (dateFrom && dateTo)
      qb.andWhere('p.paymentDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    qb.orderBy('p.paymentDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getSummary() {
    return this.paymentsRepo
      .createQueryBuilder('p')
      .leftJoin('p.expense', 'expense')
      .select('p.paymentType', 'paymentType')
      .addSelect('SUM(p.amount)', 'total')
      .where('p.isDeleted = false')
      .andWhere('(expense.isDeleted = false OR expense.isDeleted IS NULL)')
      .andWhere('(expense.status = :approved OR expense.status IS NULL)', {
        approved: 'approved',
      })
      .groupBy('p.paymentType')
      .getRawMany();
  }

  async syncExpenses() {
    const expenses = await this.expenseRepo.find({
      where: { isDeleted: false, status: ExpenseStatus.APPROVED },
    });
    let count = 0;

    for (const exp of expenses) {
      const exists = await this.paymentsRepo.findOne({
        where: { expenseId: exp.id, isDeleted: false },
      });
      if (!exists) {
        let pType = PaymentType.STAFF_EXPENSE;
        if (exp.category === ExpenseCategory.OFFICE)
          pType = PaymentType.OFFICE_MAINTENANCE;
        if (exp.category === ExpenseCategory.TRANSPORT)
          pType = PaymentType.TRANSPORT;
        if (exp.category === ExpenseCategory.TRAVEL) pType = PaymentType.TRAVEL;

        const payment = this.paymentsRepo.create({
          paymentType: pType,
          expenseId: exp.id,
          amount: exp.amount,
          paymentDate: exp.expenseDate,
          paymentMode: PaymentMode.CASH,
          payeeName: exp.paidBy || 'Staff',
          projectId: exp.projectId,
          notes: exp.description,
        });
        await this.paymentsRepo.save(payment);
        count++;
      }
    }
    return { success: true, syncedCount: count };
  }
}
