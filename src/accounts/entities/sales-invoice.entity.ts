import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { InvoiceStatus } from '../../common/enums.js';
import { Project } from '../../projects/entities/project.entity.js';
import { InvoiceItem } from './invoice-item.entity.js';
import { Payment } from '../../payments/entities/payment.entity.js';

@Entity('sales_invoices')
export class SalesInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cgstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  sgstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  igstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gstAmount: number;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reminderSentAt: Date;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, {
    cascade: true,
    eager: true,
  })
  items: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.salesInvoice)
  payments: Payment[];

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
