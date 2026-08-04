import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity.js';

@Entity('boq_items')
export class BoqItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  estimatedQty: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  estimatedRate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  estimatedAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  actualAmount: number;

  @CreateDateColumn()
  createdAt: Date;
}
