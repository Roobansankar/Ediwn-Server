import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { WeeklyTimesheet } from '../../timesheet-attendance/entities/weekly-timesheet.entity.js';

@Entity('employee_queries')
export class EmployeeQuery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  timesheetId: string;

  @ManyToOne(() => WeeklyTimesheet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'timesheetId' })
  timesheet: WeeklyTimesheet;

  @Column({ type: 'uuid' })
  siteEngineerId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'siteEngineerId' })
  siteEngineer: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'smallint', nullable: true })
  dayIndex: number | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
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
