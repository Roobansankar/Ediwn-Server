import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DailyLabourReport } from './daily-labour-report.entity.js';
import { Trade } from '../../trades/entities/trade.entity.js';

@Entity('daily_workers')
export class DailyWorker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DailyLabourReport, (report) => report.workers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reportId' })
  report: DailyLabourReport;

  @Column()
  reportId: string;

  @ManyToOne(() => Trade, { nullable: true })
  @JoinColumn({ name: 'tradeId' })
  tradeRel: Trade;

  @Column({ nullable: true })
  tradeId: string;

  @Column()
  trade: string;

  @Column({ type: 'int', default: 1 })
  count: number;

  @Column({ default: 'Morning' })
  shift: string;

  @Column({ type: 'time', nullable: true })
  inTime: string;

  @Column({ type: 'time', nullable: true })
  outTime: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  morningPhoto1Url: string;

  @Column({ nullable: true })
  morningPhoto2Url: string;

  @Column({ nullable: true })
  morningPhoto3Url: string;

  @Column({ nullable: true })
  morningPhoto4Url: string;

  @Column({ nullable: true })
  morningPhoto5Url: string;

  @Column({ nullable: true })
  eveningPhoto1Url: string;

  @Column({ nullable: true })
  eveningPhoto2Url: string;

  @Column({ nullable: true })
  eveningPhoto3Url: string;

  @Column({ nullable: true })
  eveningPhoto4Url: string;

  @Column({ nullable: true })
  eveningPhoto5Url: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;
}
