import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WeeklyTimesheet } from './weekly-timesheet.entity.js';

@Entity('timesheet_rows')
export class TimesheetRow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  timesheetId: string;

  @ManyToOne(() => WeeklyTimesheet, (t) => t.rows)
  @JoinColumn({ name: 'timesheetId' })
  timesheet: WeeklyTimesheet;

  @Column({ type: 'varchar', nullable: true })
  projectId: string | null;

  @Column({ type: 'varchar', default: 'project' })
  entryType: string;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  monHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tueHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  wedHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  thuHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  friHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  satHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  sunHours: number;

  @Column({ type: 'int', default: 0 })
  submittedMask: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
