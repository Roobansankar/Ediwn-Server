import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorCategory } from './entities/vendor-category.entity.js';
import { CreateVendorCategoryDto } from './dto/create-vendor-category.dto.js';
import { UpdateVendorCategoryDto } from './dto/update-vendor-category.dto.js';

@Injectable()
export class VendorCategoriesService {
  constructor(
    @InjectRepository(VendorCategory)
    private readonly repository: Repository<VendorCategory>,
  ) {}

  async create(dto: CreateVendorCategoryDto) {
    const name = dto.name.trim();
    const existing = await this.repository.findOne({ where: { name } });
    if (existing) {
      if (existing.isDeleted) {
        existing.isDeleted = false;
        return await this.repository.save(existing);
      }
      throw new ConflictException('Vendor category already exists');
    }
    const category = this.repository.create({ name });
    return await this.repository.save(category);
  }

  async findAll() {
    return await this.repository.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const category = await this.repository.findOne({
      where: { id, isDeleted: false },
    });
    if (!category) {
      throw new NotFoundException(`Vendor category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateVendorCategoryDto) {
    const category = await this.findOne(id);
    if (dto.name && dto.name.trim() !== category.name) {
      const existing = await this.repository.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Vendor category already exists');
      }
      category.name = dto.name.trim();
    }
    return await this.repository.save(category);
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    category.isDeleted = true;
    return await this.repository.save(category);
  }
}
