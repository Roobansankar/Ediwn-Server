import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// A weekly labour liability with an append-only installment ledger. DailyWorker
// links reserve its entries; partial records remain payable until fully settled.
export type LabourPaymentEntry = {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  referenceNumber: string | null;
  notes: string | null;
  createdById: string;
};

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

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  paymentHistory: LabourPaymentEntry[];

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
