import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseBill } from './purchase-bill.entity.js';

@Entity('bill_items')
export class BillItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseBill, (bill) => bill.billItems)
  @JoinColumn({ name: 'billId' })
  bill: PurchaseBill;

  @Column()
  billId: string;

  @Column({ nullable: true })
  poItemId: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity: number;

  @Column({ type: 'varchar', length: 20, default: 'nos' })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  orderedQty: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  billedQty: number;
}
