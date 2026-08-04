import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Project } from './project.entity.js';

@Entity('site_photos')
export class SitePhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column({ type: 'date' })
  weekDate: Date;

  @Column()
  photoUrl: string;

  @Column()
  photoKey: string;

  @Column({ nullable: true })
  caption: string;

  @CreateDateColumn()
  createdAt: Date;
}
