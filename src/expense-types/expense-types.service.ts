import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseType } from './entities/expense-type.entity.js';
import { CreateExpenseTypeDto } from './dto/create-expense-type.dto.js';

@Injectable()
export class ExpenseTypesService {
  constructor(
    @InjectRepository(ExpenseType)
    private expenseTypesRepo: Repository<ExpenseType>,
  ) {}

  async create(dto: CreateExpenseTypeDto): Promise<ExpenseType> {
    const type = this.expenseTypesRepo.create(dto);
    return this.expenseTypesRepo.save(type);
  }

  async findAll(): Promise<ExpenseType[]> {
    return this.expenseTypesRepo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ExpenseType> {
    const type = await this.expenseTypesRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!type) throw new NotFoundException('Expense Type not found');
    return type;
  }

  async update(id: string, dto: CreateExpenseTypeDto): Promise<ExpenseType> {
    const type = await this.findOne(id);
    type.name = dto.name;
    return this.expenseTypesRepo.save(type);
  }

  async remove(id: string): Promise<void> {
    const type = await this.findOne(id);
    type.isDeleted = true;
    await this.expenseTypesRepo.save(type);
  }
}
