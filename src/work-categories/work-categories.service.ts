import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkCategory } from './entities/work-category.entity.js';
import { CreateWorkCategoryDto } from './dto/create-work-category.dto.js';

@Injectable()
export class WorkCategoriesService {
  constructor(
    @InjectRepository(WorkCategory)
    private readonly repository: Repository<WorkCategory>,
  ) {}

  async create(dto: CreateWorkCategoryDto) {
    const existing = await this.repository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      if (existing.isDeleted) {
        existing.isDeleted = false;
        return await this.repository.save(existing);
      }
      throw new ConflictException('Work category already exists');
    }
    const category = this.repository.create(dto);
    return await this.repository.save(category);
  }

  async findAll() {
    return await this.repository.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async remove(id: string) {
    const category = await this.repository.findOne({
      where: { id, isDeleted: false },
    });
    if (!category) {
      throw new NotFoundException(`Work category with ID ${id} not found`);
    }
    category.isDeleted = true;
    return await this.repository.save(category);
  }
}
