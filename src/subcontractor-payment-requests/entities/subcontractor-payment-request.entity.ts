import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subcontractor } from '../../subcontractors/entities/subcontractor.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { SubcontractWorkOrder } from '../../subcontract-work-orders/entities/subcontract-work-order.entity.js';

@Entity('subcontractor_payment_requests')
export class SubcontractorPaymentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  subcontractorId: string;

  @ManyToOne(() => Subcontractor, { eager: true })
  @JoinColumn({ name: 'subcontractorId' })
  subcontractor: Subcontractor;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'uuid', nullable: true })
  subcontractWorkOrderId: string | null;

  @ManyToOne(() => SubcontractWorkOrder, { eager: true })
  @JoinColumn({ name: 'subcontractWorkOrderId' })
  subcontractWorkOrder: SubcontractWorkOrder | null;

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
