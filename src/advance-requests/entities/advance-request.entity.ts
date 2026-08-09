import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vendor } from '../../vendors/entities/vendor.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { VendorQuotation } from '../../vendor-quotations/entities/vendor-quotation.entity.js';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity.js';

@Entity('advance_requests')
export class AdvanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, { eager: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'varchar', nullable: true })
  materialRequirementNo: string | null;

  @Column({ type: 'uuid', nullable: true })
  vendorQuotationId: string | null;

  @ManyToOne(() => VendorQuotation, { eager: true })
  @JoinColumn({ name: 'vendorQuotationId' })
  vendorQuotation: VendorQuotation | null;

  @Column({ type: 'uuid', nullable: true })
  purchaseOrderId: string | null;

  @ManyToOne(() => PurchaseOrder, { eager: true })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'uuid' })
  requestedById: string;

  @Column({ type: 'uuid', nullable: true })
  respondedById: string | null;

  @Column({ type: 'date', nullable: true })
  respondedAt: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
