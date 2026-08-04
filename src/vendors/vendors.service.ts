import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorsRepository: Repository<Vendor>,
  ) {}

  async create(dto: CreateVendorDto): Promise<Vendor> {
    const vendor = this.vendorsRepository.create(dto);
    return this.vendorsRepository.save(vendor);
  }

  async findAll(): Promise<Vendor[]> {
    return this.vendorsRepository.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, dto: any): Promise<Vendor> {
    const vendor = await this.findOne(id);
    Object.assign(vendor, dto);
    return this.vendorsRepository.save(vendor);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.findOne(id);
    vendor.isDeleted = true;
    await this.vendorsRepository.save(vendor);
  }
}
