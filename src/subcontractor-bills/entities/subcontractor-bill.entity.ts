import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BillStatus } from '../../common/enums.js';
import { Subcontractor } from '../../subcontractors/entities/subcontractor.entity.js';
import { SubcontractWorkOrder } from '../../subcontract-work-orders/entities/subcontract-work-order.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Payment } from '../../payments/entities/payment.entity.js';

// Mirrors PurchaseBill (accounts/entities/purchase-bill.entity.ts) but for
// subcontract labour/work instead of material purchases - billed against a
// Subcontract Work Order rather than a Purchase Order, and with no
// itemized bill-items (a WO is a single lump-sum scope of work, not a list
// of priced line items like a PO).
@Entity('subcontractor_bills')
export class SubcontractorBill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  billNumber: string;

  @ManyToOne(() => Subcontractor, { eager: true })
  @JoinColumn({ name: 'subcontractorId' })
  subcontractor: Subcontractor;

  @Column()
  subcontractorId: string;

  @ManyToOne(() => SubcontractWorkOrder, { nullable: true })
  @JoinColumn({ name: 'subcontractWorkOrderId' })
  subcontractWorkOrder: SubcontractWorkOrder;

  @Column({ nullable: true })
  subcontractWorkOrderId: string;

  @ManyToOne(() => Project, { nullable: true })
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

  @OneToMany(() => Payment, (payment) => payment.subcontractorBill)
  payments: Payment[];

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
