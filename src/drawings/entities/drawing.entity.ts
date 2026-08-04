import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DrawingCategory } from '../../common/enums.js';
import { Project } from '../../projects/entities/project.entity.js';

@Entity('drawings')
export class Drawing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: DrawingCategory })
  category: DrawingCategory;

  @Column({ default: 'Rev A' })
  revision: string;

  @Column()
  fileUrl: string;

  @Column()
  fileKey: string;

  @Column({ nullable: true })
  uploadedBy: string;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
