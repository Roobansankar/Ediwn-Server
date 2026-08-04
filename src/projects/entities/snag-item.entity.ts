import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SnagStatus } from '../../common/enums.js';
import { Project } from './project.entity.js';

@Entity('snag_items')
export class SnagItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column()
  taskDescription: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ type: 'enum', enum: SnagStatus, default: SnagStatus.OPEN })
  status: SnagStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
