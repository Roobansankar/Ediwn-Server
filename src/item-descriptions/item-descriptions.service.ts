import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemDescription } from './entities/item-description.entity.js';
import { CreateItemDescriptionDto } from './dto/create-item-description.dto.js';
import { UpdateItemDescriptionDto } from './dto/update-item-description.dto.js';

@Injectable()
export class ItemDescriptionsService {
  constructor(
    @InjectRepository(ItemDescription)
    private readonly repository: Repository<ItemDescription>,
  ) {}

  async create(dto: CreateItemDescriptionDto) {
    const existing = await this.repository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      if (existing.isDeleted) {
        existing.isDeleted = false;
        return await this.repository.save(existing);
      }
      throw new ConflictException('Item description already exists');
    }
    const item = this.repository.create(dto);
    return await this.repository.save(item);
  }

  async findAll() {
    return await this.repository.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const item = await this.repository.findOne({
      where: { id, isDeleted: false },
    });
    if (!item) {
      throw new NotFoundException(`Item description with ID ${id} not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateItemDescriptionDto) {
    const item = await this.findOne(id);
    if (dto.name && dto.name !== item.name) {
      const existing = await this.repository.findOne({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Item description already exists');
      }
    }
    Object.assign(item, dto);
    return await this.repository.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    item.isDeleted = true;
    return await this.repository.save(item);
  }
}
