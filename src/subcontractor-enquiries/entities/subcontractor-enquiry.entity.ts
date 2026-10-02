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
import { Subcontractor } from '../../subcontractors/entities/subcontractor.entity.js';
import { WorkCategory } from '../../work-categories/entities/work-category.entity.js';

// One row per subcontractor's quote for a trade (Work Category) on a
// project - several rows share the same groupId (and the same scrNo,
// copied onto every row) so the UI can compare multiple subcontractors'
// quotes for the same scope side by side, same shape as vendor_quotations
// does for material purchasing.
@Entity('subcontractor_enquiries')
export class SubcontractorEnquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  scrNo: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => WorkCategory, { eager: true })
  @JoinColumn({ name: 'workCategoryId' })
  workCategory: WorkCategory;

  @Column()
  workCategoryId: string;

  @ManyToOne(() => Subcontractor, { eager: true })
  @JoinColumn({ name: 'subcontractorId' })
  subcontractor: Subcontractor;

  @Column()
  subcontractorId: string;

  @Column({ type: 'text', nullable: true })
  scopeOfWork: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gstPercent: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  gstAmount: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalWithGst: number | null;

  @Column({ nullable: true })
  quotationUrl: string;

  @Column({ nullable: true })
  quotationKey: string;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
