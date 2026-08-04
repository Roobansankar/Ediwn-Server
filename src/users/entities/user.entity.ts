import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Role } from '../../common/enums.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Salary } from '../../salaries/entities/salary.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  employeeId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  staffType: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.VIEWER })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  salaryGradeId: string | null;

  @ManyToOne(() => Salary, { nullable: true })
  @JoinColumn({ name: 'salaryGradeId' })
  salaryGrade: Salary;

  @ManyToMany(() => Project)
  @JoinTable({ name: 'user_projects' })
  projects: Project[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
