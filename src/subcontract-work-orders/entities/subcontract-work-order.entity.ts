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
import { Project } from '../../projects/entities/project.entity.js';
import { Subcontractor } from '../../subcontractors/entities/subcontractor.entity.js';
import { WorkCategory } from '../../work-categories/entities/work-category.entity.js';
import { SubcontractWorkOrderStatus } from '../../common/enums.js';
import { Payment } from '../../payments/entities/payment.entity.js';

@Entity('subcontract_work_orders')
export class SubcontractWorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  woNumber: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => Subcontractor, { eager: true })
  @JoinColumn({ name: 'subcontractorId' })
  subcontractor: Subcontractor;

  @Column()
  subcontractorId: string;

  @ManyToOne(() => WorkCategory, { eager: true })
  @JoinColumn({ name: 'workCategoryId' })
  workCategory: WorkCategory;

  @Column()
  workCategoryId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 18 })
  gstPercentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  workorderUrl: string;

  @Column({ nullable: true })
  workorderKey: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubcontractWorkOrderStatus,
    default: SubcontractWorkOrderStatus.PENDING,
  })
  status: SubcontractWorkOrderStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToMany(() => Payment, (payment) => payment.subcontractWorkOrder)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
