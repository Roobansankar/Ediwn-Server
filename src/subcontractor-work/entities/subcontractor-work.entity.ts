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
import { Subcontractor } from '../../subcontractors/entities/subcontractor.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { SubcontractWorkOrder } from '../../subcontract-work-orders/entities/subcontract-work-order.entity.js';

@Entity('subcontractor_works')
export class SubcontractorWork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @ManyToOne(() => SubcontractWorkOrder, { eager: true, nullable: true })
  @JoinColumn({ name: 'subcontractWorkOrderId' })
  subcontractWorkOrder: SubcontractWorkOrder | null;

  @Column({ type: 'uuid', nullable: true })
  subcontractWorkOrderId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', array: true, nullable: true })
  photoUrls: string[];

  @Column({ type: 'text', array: true, nullable: true })
  photoKeys: string[];

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @Column({ nullable: true })
  respondedById: string;

  @Column({ type: 'date', nullable: true })
  respondedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
