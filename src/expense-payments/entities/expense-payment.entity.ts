import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// One record = one week's lump-sum reimbursement paid to one staff member,
// covering every admin-approved expense they submitted that week. Individual
// Expense rows get their `expensePaymentId` set once they're attached to a
// record here, so the same claim can never be paid twice.
//
// `userName` is a snapshot taken at creation time (same pattern as
// Payment.payeeName elsewhere in this app) rather than a live join to the
// User table, so this record stays accurate even if the user's account is
// later renamed or deactivated.
@Entity('expense_payments')
export class ExpensePayment {
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
