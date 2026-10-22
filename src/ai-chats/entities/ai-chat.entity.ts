import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Entity('ai_chats')
@Index('IDX_ai_chats_user_updated', ['userId', 'updatedAt'])
export class AiChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 120, default: 'New chat' })
  title: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  messages: ChatMessage[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
