import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Project } from './project.entity.js';

@Entity('project_progress')
export class ProjectProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column({ type: 'date' })
  weekStartDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  plannedPct: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  actualPct: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
