import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectCategory } from './entities/project-category.entity.js';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto.js';

@Injectable()
export class ProjectCategoriesService {
  constructor(
    @InjectRepository(ProjectCategory)
    private readonly repository: Repository<ProjectCategory>,
  ) {}

  async create(dto: CreateProjectCategoryDto) {
    const existing = await this.repository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      if (existing.isDeleted) {
        existing.isDeleted = false;
        return await this.repository.save(existing);
      }
      throw new ConflictException('Project category already exists');
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
      throw new NotFoundException(`Project category with ID ${id} not found`);
    }
    category.isDeleted = true;
    return await this.repository.save(category);
  }
}
