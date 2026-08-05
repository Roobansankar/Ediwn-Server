import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrderStatus } from '../../common/enums.js';
import { Vendor } from '../../vendors/entities/vendor.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { PoItem } from './po-item.entity.js';
import { Payment } from '../../payments/entities/payment.entity.js';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  poNumber: string;

  @ManyToOne(() => Vendor, { eager: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column()
  vendorId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column({ nullable: true })
  materialRequirementNo: string;

  @Column({ type: 'varchar', length: 50, default: PurchaseOrderStatus.PENDING })
  status: PurchaseOrderStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gstPercent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  gstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalWithGst: number;

  @Column({ nullable: true })
  billFileUrl: string;

  @Column({ nullable: true })
  billFileKey: string;

  @OneToMany(() => PoItem, (item) => item.purchaseOrder, {
    cascade: true,
    eager: true,
  })
  items: PoItem[];

  @OneToMany(() => Payment, (payment) => payment.purchaseOrder)
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
