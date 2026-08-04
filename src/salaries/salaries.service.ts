import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salary } from './entities/salary.entity.js';
import { CreateSalaryDto } from './dto/create-salary.dto.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class SalariesService {
  constructor(
    @InjectRepository(Salary)
    private salariesRepository: Repository<Salary>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateSalaryDto): Promise<Salary> {
    const salary = this.salariesRepository.create(dto);
    return this.salariesRepository.save(salary);
  }

  async findAll(): Promise<Salary[]> {
    return this.salariesRepository.find({
      where: { isDeleted: false },
      order: { grades: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Salary> {
    const salary = await this.salariesRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!salary) throw new NotFoundException('Salary record not found');
    return salary;
  }

  async update(id: string, dto: any): Promise<Salary> {
    const salary = await this.findOne(id);
    Object.assign(salary, dto);
    return this.salariesRepository.save(salary);
  }

  async remove(id: string): Promise<void> {
    const salary = await this.findOne(id);
    salary.isDeleted = true;
    await this.salariesRepository.save(salary);
  }

  async findMySalary(userId: string): Promise<Salary | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user?.salaryGradeId) return null;
    const salary = await this.salariesRepository.findOne({
      where: { id: user.salaryGradeId, isDeleted: false },
    });
    return salary || null;
  }

  async upsertMySalary(userId: string, dto: CreateSalaryDto): Promise<Salary> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    let salary: Salary;
    if (user.salaryGradeId) {
      const existing = await this.salariesRepository.findOne({
        where: { id: user.salaryGradeId },
      });
      if (existing) {
        Object.assign(existing, dto);
        salary = existing;
      } else {
        salary = this.salariesRepository.create(dto);
      }
    } else {
      salary = this.salariesRepository.create(dto);
    }

    salary = await this.salariesRepository.save(salary);

    if (!user.salaryGradeId || user.salaryGradeId !== salary.id) {
      user.salaryGradeId = salary.id;
      await this.usersRepository.save(user);
    }

    return salary;
  }
}
