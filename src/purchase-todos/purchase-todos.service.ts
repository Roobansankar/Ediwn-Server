import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseTodo } from './entities/purchase-todo.entity.js';
import { CreatePurchaseTodoDto } from './dto/create-purchase-todo.dto.js';
import { UpdatePurchaseTodoDto } from './dto/update-purchase-todo.dto.js';

@Injectable()
export class PurchaseTodosService {
  constructor(
    @InjectRepository(PurchaseTodo)
    private readonly todosRepository: Repository<PurchaseTodo>,
  ) {}

  // Always scoped to the logged-in user — every purchase user only sees
  // and mutates their own private list.
  async findMine(userId: string): Promise<PurchaseTodo[]> {
    return this.todosRepository.find({
      where: { userId, isDeleted: false },
      order: { isDone: 'ASC', createdAt: 'DESC' },
    });
  }

  async create(
    userId: string,
    dto: CreatePurchaseTodoDto,
  ): Promise<PurchaseTodo> {
    const today = new Date().toISOString().slice(0, 10);
    const todo = this.todosRepository.create({
      userId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      dueDate: dto.dueDate || today,
    });
    return this.todosRepository.save(todo);
  }

  private async findOneMine(id: string, userId: string): Promise<PurchaseTodo> {
    const todo = await this.todosRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }
    if (todo.userId !== userId) {
      throw new ForbiddenException('You can only manage your own todos');
    }
    return todo;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePurchaseTodoDto,
  ): Promise<PurchaseTodo> {
    const todo = await this.findOneMine(id, userId);
    if (dto.title !== undefined) todo.title = dto.title.trim();
    if (dto.description !== undefined)
      todo.description = dto.description?.trim() || null;
    if (dto.dueDate !== undefined) todo.dueDate = dto.dueDate || null;
    if (dto.isDone !== undefined) todo.isDone = dto.isDone;
    return this.todosRepository.save(todo);
  }

  async remove(id: string, userId: string) {
    const todo = await this.findOneMine(id, userId);
    todo.isDeleted = true;
    return this.todosRepository.save(todo);
  }
}
