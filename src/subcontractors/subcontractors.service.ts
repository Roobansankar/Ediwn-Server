import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subcontractor } from './entities/subcontractor.entity.js';
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto.js';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto.js';

@Injectable()
export class SubcontractorsService {
  constructor(
    @InjectRepository(Subcontractor)
    private readonly repository: Repository<Subcontractor>,
  ) {}

  async create(dto: CreateSubcontractorDto) {
    const subcontractor = this.repository.create(dto);
    return await this.repository.save(subcontractor);
  }

  async findAll() {
    return await this.repository.find({
      where: { isDeleted: false },
      relations: ['workCategory'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const subcontractor = await this.repository.findOne({
      where: { id, isDeleted: false },
      relations: ['workCategory'],
    });
    if (!subcontractor) {
      throw new NotFoundException(`Subcontractor with ID ${id} not found`);
    }
    return subcontractor;
  }

  async update(id: string, dto: UpdateSubcontractorDto) {
    const subcontractor = await this.findOne(id);
    Object.assign(subcontractor, dto);
    return await this.repository.save(subcontractor);
  }

  async remove(id: string) {
    const subcontractor = await this.findOne(id);
    subcontractor.isDeleted = true;
    return await this.repository.save(subcontractor);
  }
}
