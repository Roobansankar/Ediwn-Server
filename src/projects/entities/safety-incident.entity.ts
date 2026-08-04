import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SeverityLevel } from '../../common/enums.js';
import { Project } from './project.entity.js';

@Entity('safety_incidents')
export class SafetyIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column({ type: 'date' })
  incidentDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: SeverityLevel, default: SeverityLevel.LOW })
  severity: SeverityLevel;

  @CreateDateColumn()
  createdAt: Date;
}
