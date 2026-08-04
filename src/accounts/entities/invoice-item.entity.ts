import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesInvoice } from './sales-invoice.entity.js';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SalesInvoice, (inv) => inv.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: SalesInvoice;

  @Column()
  invoiceId: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ default: 'nos' })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;
}
