import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity.js';

// A trade name is unique within a team, so two teams can each have a
// "Carpenters" trade.
@Entity('trades')
@Index('IDX_trades_name_teamId', ['name', 'teamId'], { unique: true })
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  teamId: string | null;

  @ManyToOne(() => Team, { eager: true })
  @JoinColumn({ name: 'teamId' })
  team: Team | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  shiftWiseAmount: number | null;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
