import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity.js';
import { Vendor } from '../../vendors/entities/vendor.entity.js';
import { PurchaseEnquiry } from '../../purchase-enquiries/entities/purchase-enquiry.entity.js';

@Entity('vendor_quotations')
export class VendorQuotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => Vendor, { eager: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column()
  vendorId: string;

  @Column({ type: 'jsonb', default: [] })
  items: { description: string; quantity: number }[];

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount: number | null;

  @Column({ nullable: true })
  quotationUrl: string;

  @Column({ nullable: true })
  quotationKey: string;

  @ManyToOne(() => PurchaseEnquiry)
  @JoinColumn({ name: 'materialRequirementId' })
  materialRequirement: PurchaseEnquiry;

  @Column({ nullable: true })
  materialRequirementId: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
