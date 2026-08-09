import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import {
  ProjectStatus,
  ProjectNature,
  JobType,
  JobStatus,
} from '../../common/enums.js';
import { ProjectCategory } from '../../project-categories/entities/project-category.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Nullable at the DB level so TypeORM's auto-sync doesn't choke on pre-existing rows;
  // the create form/DTO still requires it for every new project (see CreateProjectDto).
  @Column({ unique: true, nullable: true })
  projectCode: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone1: string;

  @Column({ nullable: true })
  phone2: string;

  @Column({ nullable: true })
  clientName: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @Column({ nullable: true })
  projectCategoryId: string;

  @ManyToOne(() => ProjectCategory, { eager: true, nullable: true })
  @JoinColumn({ name: 'projectCategoryId' })
  projectCategory: ProjectCategory;

  @Column({ type: 'enum', enum: ProjectNature, nullable: true })
  projectNature: ProjectNature;

  @Column({ type: 'enum', enum: JobType, nullable: true })
  jobType: JobType;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.BIDDING })
  jobStatus: JobStatus;

  @Column({ nullable: true })
  financialYear: string;

  @Column({ type: 'date', nullable: true })
  dateOfCreation: Date;

  @ManyToMany(() => User)
  @JoinTable({ name: 'project_resources' })
  resources: User[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPct: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  estimatedBudget: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  estimatedGst: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  estimatedTotal: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

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
