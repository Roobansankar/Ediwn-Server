import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiChat } from './entities/ai-chat.entity.js';

@Injectable()
export class AiChatsService {
  constructor(
    @InjectRepository(AiChat) private readonly chats: Repository<AiChat>,
  ) {}

  list(userId: string) {
    return this.chats.find({
      where: { userId },
      select: ['id', 'title', 'createdAt', 'updatedAt'],
      order: { updatedAt: 'DESC' },
    });
  }

  create(userId: string) {
    return this.chats.save(
      this.chats.create({ userId, title: 'New chat', messages: [] }),
    );
  }

  async find(id: string, userId: string) {
    const chat = await this.chats.findOneBy({ id, userId });
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async append(
    id: string,
    userId: string,
    input: { user: string; assistant: string; expectedCount: number },
  ) {
    return this.chats.manager.transaction(async (manager) => {
      const repo = manager.getRepository(AiChat);
      const chat = await repo.findOne({
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!chat) throw new NotFoundException('Chat not found');
      if (chat.messages.length !== input.expectedCount)
        throw new ConflictException(
          'Chat changed in another tab. Reopen it before sending again.',
        );
      if (!chat.messages.length) chat.title = input.user.trim().slice(0, 120);
      chat.messages.push(
        { role: 'user', content: input.user.trim() },
        { role: 'assistant', content: input.assistant },
      );
      return repo.save(chat);
    });
  }

  async remove(id: string, userId: string) {
    const result = await this.chats.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Chat not found');
    return { deleted: true };
  }
}
