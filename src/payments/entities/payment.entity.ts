import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentType, PaymentMode } from '../../common/enums.js';
import { Project } from '../../projects/entities/project.entity.js';
import { PurchaseBill } from '../../accounts/entities/purchase-bill.entity.js';
import { Vendor } from '../../vendors/entities/vendor.entity.js';
import { Expense } from '../../expenses/entities/expense.entity.js';
import { SalesInvoice } from '../../accounts/entities/sales-invoice.entity.js';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity.js';
import { SubcontractWorkOrder } from '../../subcontract-work-orders/entities/subcontract-work-order.entity.js';
import { AdvanceRequest } from '../../advance-requests/entities/advance-request.entity.js';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.MATERIAL })
  paymentType: PaymentType;

  @ManyToOne(() => PurchaseBill, (bill) => bill.payments, { nullable: true })
  @JoinColumn({ name: 'purchaseBillId' })
  purchaseBill: PurchaseBill;

  @Column({ nullable: true })
  purchaseBillId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.payments, { nullable: true })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @ManyToOne(() => SubcontractWorkOrder, (swo) => swo.payments, { nullable: true })
  @JoinColumn({ name: 'subcontractWorkOrderId' })
  subcontractWorkOrder: SubcontractWorkOrder;

  @Column({ nullable: true })
  subcontractWorkOrderId: string;

  @ManyToOne(() => AdvanceRequest, { nullable: true })
  @JoinColumn({ name: 'advanceRequestId' })
  advanceRequest: AdvanceRequest;

  @Column({ nullable: true })
  advanceRequestId: string;

  @ManyToOne(() => SalesInvoice, (invoice) => invoice.payments, {
    nullable: true,
  })
  @JoinColumn({ name: 'salesInvoiceId' })
  salesInvoice: SalesInvoice;

  @Column({ nullable: true })
  salesInvoiceId: string;

  @ManyToOne(() => Expense, { nullable: true })
  @JoinColumn({ name: 'expenseId' })
  expense: Expense;

  @Column({ nullable: true })
  expenseId: string;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  payeeName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'varchar', length: 50, default: PaymentMode.CASH })
  paymentMode: PaymentMode;

  @Column({ nullable: true })
  referenceNumber: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  timesheetId: string;

  @CreateDateColumn()
  createdAt: Date;
}
