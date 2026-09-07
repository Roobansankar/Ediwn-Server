import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// One record = one week's lump-sum labour wage payment made to one site
// engineer, covering every admin-approved trade entry they submitted that
// week. Individual DailyWorker rows get their `labourPaymentId` set once
// attached to a record here, so the same trade entry can never be paid
// twice. Mirrors ExpensePayment (same shape, same weekly/per-user model).
//
// `userName` is a snapshot taken at creation time (same pattern as
// Payment.payeeName elsewhere in this app) rather than a live join to the
// User table, so this record stays accurate even if the user's account is
// later renamed or deactivated.
@Entity('labour_payments')
export class LabourPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  userName: string;

  @Column({ type: 'date' })
  weekStart: Date;

  @Column({ type: 'date' })
  weekEnd: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
