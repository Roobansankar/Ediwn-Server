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
import { WorkOrderStatus } from '../../common/enums.js';
import { Vendor } from '../../vendors/entities/vendor.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { WorkOrderItem } from './work-order-item.entity.js';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  woNumber: string;

  @ManyToOne(() => Vendor, { eager: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column()
  vendorId: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.DRAFT,
  })
  status: WorkOrderStatus;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cgstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  sgstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  igstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gstAmount: number;

  @OneToMany(() => WorkOrderItem, (item) => item.workOrder, {
    cascade: true,
    eager: true,
  })
  items: WorkOrderItem[];

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
