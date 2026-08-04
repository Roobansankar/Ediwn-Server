import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Notification } from './entities/notification.entity.js';

export type NotificationInput = {
  recipientId?: string | null;
  recipientRole?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  entityId?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(input: NotificationInput): Promise<Notification> {
    const notification = this.repo.create({
      recipientId: input.recipientId ?? null,
      recipientRole: input.recipientRole ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      entityId: input.entityId ?? null,
      isRead: false,
    });
    return this.repo.save(notification);
  }

  private async resolveActor(userId?: string | null) {
    if (!userId) return { id: null, name: null };
    const user = await this.usersRepo.findOne({
      where: { id: userId, isActive: true },
    });
    return { id: userId, name: user?.name ?? null };
  }

  async createForRole(
    role: string,
    input: Omit<NotificationInput, 'recipientRole'> & { userId?: string },
  ): Promise<Notification> {
    const { id, name } = await this.resolveActor(input.userId);
    return this.create({
      ...input,
      actorId: id,
      actorName: name,
      recipientRole: role,
    });
  }

  async createForUser(
    userId: string,
    input: Omit<NotificationInput, 'recipientId'> & { userId?: string },
  ): Promise<Notification> {
    const { id, name } = await this.resolveActor(input.userId);
    return this.create({
      ...input,
      actorId: id,
      actorName: name,
      recipientId: userId,
    });
  }

  async findByUser(userId: string, role: string): Promise<Notification[]> {
    return this.repo
      .createQueryBuilder('n')
      .where('n.recipientId = :userId OR n.recipientRole = :role', {
        userId,
        role,
      })
      .orderBy('n.createdAt', 'DESC')
      .take(50)
      .getMany();
  }

  async unreadCount(userId: string, role: string): Promise<number> {
    return this.repo
      .createQueryBuilder('n')
      .where('n.recipientId = :userId OR n.recipientRole = :role', {
        userId,
        role,
      })
      .andWhere('n.isRead = false')
      .getCount();
  }

  async markAllRead(userId: string, role: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('recipientId = :userId OR recipientRole = :role', {
        userId,
        role,
      })
      .andWhere('isRead = false')
      .execute();
  }
}
