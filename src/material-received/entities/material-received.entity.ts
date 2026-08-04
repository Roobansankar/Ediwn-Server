import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity.js';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('material_received')
export class MaterialReceived {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  mrNumber: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column({ nullable: true })
  purchaseOrderId: string;

  @Column({ type: 'date', nullable: true })
  receivedDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: [] })
  items: { description: string; quantity: number }[];

  @Column({ type: 'jsonb', default: [] })
  photoUrls: string[];

  @Column({ type: 'jsonb', default: [] })
  photoKeys: string[];

  @Column({ nullable: true })
  billUrl: string;

  @Column({ nullable: true })
  billKey: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
