import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { WorkCategory } from '../../work-categories/entities/work-category.entity.js';

@Entity('subcontractors')
export class Subcontractor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @ManyToOne(() => WorkCategory, { nullable: true, eager: true })
  workCategory: WorkCategory;

  @Column({ nullable: true })
  workCategoryId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
