import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RfiStatus } from '../../common/enums.js';
import { Project } from './project.entity.js';

@Entity('rfis')
export class Rfi {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  raisedBy: string;

  @Column({ type: 'date' })
  raisedDate: Date;

  @Column({ type: 'enum', enum: RfiStatus, default: RfiStatus.OPEN })
  status: RfiStatus;

  @Column({ type: 'date', nullable: true })
  responseDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
