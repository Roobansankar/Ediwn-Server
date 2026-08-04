import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('salaries')
export class Salary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  grades: string;

  @Column({ default: '' })
  category: string;

  @Column({ default: '' })
  role: string;

  @Column()
  expInYears: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monthlySalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  avgCostPerHr: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  bookingCost: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
