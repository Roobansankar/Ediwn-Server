import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExpenseCategory, ExpenseStatus } from '../../common/enums.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Trade } from '../../trades/entities/trade.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { ExpenseType } from '../../expense-types/entities/expense-type.entity.js';
import { ExpensePayment } from '../../expense-payments/entities/expense-payment.entity.js';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ExpenseCategory, nullable: true })
  category: ExpenseCategory;

  @ManyToOne(() => ExpenseType, { nullable: true })
  @JoinColumn({ name: 'expenseTypeId' })
  expenseType: ExpenseType;

  @Column({ nullable: true })
  expenseTypeId: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status: ExpenseStatus;

  @Column({ nullable: true })
  paidBy: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @ManyToOne(() => Trade, { nullable: true })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column({ nullable: true })
  tradeId: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ nullable: true })
  receiptKey: string;

  @Column({ type: 'simple-json', nullable: true })
  receiptUrls: string[];

  @Column({ type: 'simple-json', nullable: true })
  receiptKeys: string[];

  @Column({ type: 'simple-json', nullable: true })
  sitePhotoUrls: string[];

  @Column({ type: 'simple-json', nullable: true })
  sitePhotoKeys: string[];

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ nullable: true })
  createdBy: string;

  // Set by accounts/admin alongside a status change (mainly on reject) so
  // the person who submitted this expense sees why.
  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  // Set once this expense is attached to a weekly ExpensePayment record, so
  // it can't be included in a second payment run. The payment itself starts
  // out 'pending' and only becomes 'paid' once accounts actually pays it —
  // that's the point at which this expense should count toward its
  // project's spend (see ProjectsService.getProjectDetails).
  @ManyToOne(() => ExpensePayment, { nullable: true })
  @JoinColumn({ name: 'expensePaymentId' })
  expensePayment: ExpensePayment | null;

  @Column({ type: 'uuid', nullable: true })
  expensePaymentId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
