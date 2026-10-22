import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AiChat } from './entities/ai-chat.entity.js';
import { AiChatsService } from './ai-chats.service.js';

describe('AiChatsService', () => {
  const findOne = jest.fn();
  const findOneBy = jest.fn();
  const save = jest.fn((chat: AiChat) => Promise.resolve(chat));
  const remove = jest.fn();
  const repository = {
    findOneBy,
    delete: remove,
    manager: {
      transaction: (callback: (manager: unknown) => unknown) =>
        callback({ getRepository: () => ({ findOne, save }) }),
    },
  } as unknown as Repository<AiChat>;
  const service = new AiChatsService(repository);
  beforeEach(() => jest.clearAllMocks());

  it('scopes reads and deletion to the owner', async () => {
    findOneBy.mockResolvedValue({ id: 'chat' });
    remove.mockResolvedValue({ affected: 1 });
    await service.find('chat', 'owner');
    await service.remove('chat', 'owner');
    expect(findOneBy).toHaveBeenCalledWith({ id: 'chat', userId: 'owner' });
    expect(remove).toHaveBeenCalledWith({ id: 'chat', userId: 'owner' });
  });

  it('rejects missing or other users’ conversations', async () => {
    findOneBy.mockResolvedValue(null);
    remove.mockResolvedValue({ affected: 0 });
    await expect(service.find('chat', 'other')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove('chat', 'other')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('saves a complete exchange under a row lock and names the first conversation', async () => {
    findOne.mockResolvedValue({ id: 'chat', title: 'New chat', messages: [] });
    const result = await service.append('chat', 'owner', {
      user: ' Plan work ',
      assistant: 'A plan',
      expectedCount: 0,
    });
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'chat', userId: 'owner' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(result.title).toBe('Plan work');
    expect(result.messages).toEqual([
      { role: 'user', content: 'Plan work' },
      { role: 'assistant', content: 'A plan' },
    ]);
  });

  it('does not overwrite a conversation changed by another tab', async () => {
    findOne.mockResolvedValue({
      messages: [
        { role: 'user', content: 'Existing' },
        { role: 'assistant', content: 'Reply' },
      ],
    });
    await expect(
      service.append('chat', 'owner', {
        user: 'Question',
        assistant: 'Answer',
        expectedCount: 0,
      }),
    ).rejects.toThrow(ConflictException);
    expect(save).not.toHaveBeenCalled();
  });
});
