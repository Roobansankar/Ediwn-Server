import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Project } from './project.entity.js';

@Entity('machinery_logs')
export class MachineryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column()
  machineName: string;

  @Column({ type: 'date' })
  logDate: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  usageHours: number;

  @CreateDateColumn()
  createdAt: Date;
}
