import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { DailyWorker } from './daily-worker.entity.js';

@Entity('daily_labour_reports')
export class DailyLabourReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column({ type: 'date' })
  reportDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => DailyWorker, (worker) => worker.report, {
    cascade: true,
    eager: true,
  })
  workers: DailyWorker[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
