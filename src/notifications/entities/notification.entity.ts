import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  recipientId: string | null;

  @Column({ type: 'varchar', nullable: true })
  recipientRole: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', nullable: true })
  actorName: string | null;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', nullable: true })
  link: string | null;

  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
