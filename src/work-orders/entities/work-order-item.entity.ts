import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity.js';

@Entity('work_order_items')
export class WorkOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkOrder, (wo) => wo.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column()
  workOrderId: string;

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
