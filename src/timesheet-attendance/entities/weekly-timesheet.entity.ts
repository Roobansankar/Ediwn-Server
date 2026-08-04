import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TimesheetRow } from './timesheet-row.entity.js';

@Entity('weekly_timesheets')
export class WeeklyTimesheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  siteEngineerId: string;

  @Column({ type: 'date' })
  weekStart: Date;

  @Column({ type: 'date' })
  weekEnd: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalHours: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  approvedById: string | null;

  @Column({ type: 'date', nullable: true })
  approvedAt: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToMany(() => TimesheetRow, (row) => row.timesheet, {
    cascade: true,
    eager: true,
  })
  rows: TimesheetRow[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
