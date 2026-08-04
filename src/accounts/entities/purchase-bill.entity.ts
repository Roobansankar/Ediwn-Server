import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BillStatus } from '../../common/enums.js';
import { Vendor } from '../../vendors/entities/vendor.entity.js';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Payment } from '../../payments/entities/payment.entity.js';
import { BillItem } from './bill-item.entity.js';

@Entity('purchase_bills')
export class PurchaseBill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  billNumber: string;

  @ManyToOne(() => Vendor, { eager: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column()
  vendorId: string;

  @ManyToOne(() => PurchaseOrder, { nullable: true })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gstPercent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  gstAmount: number;

  @Column({ type: 'varchar', length: 50, default: BillStatus.PENDING })
  status: BillStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'date', nullable: true })
  billDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', nullable: true })
  billFileUrl: string;

  @Column({ type: 'varchar', nullable: true })
  billFileKey: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @OneToMany(() => Payment, (payment) => payment.purchaseBill)
  payments: Payment[];

  @OneToMany(() => BillItem, (item) => item.bill, { cascade: true })
  billItems: BillItem[];

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
