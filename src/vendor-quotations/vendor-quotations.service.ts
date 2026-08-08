import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { VendorQuotation } from './entities/vendor-quotation.entity.js';
import { CreateVendorQuotationDto } from './dto/create-vendor-quotation.dto.js';
import { UpdateVendorQuotationDto } from './dto/update-vendor-quotation.dto.js';

@Injectable()
export class VendorQuotationsService {
  constructor(
    @InjectRepository(VendorQuotation)
    private repo: Repository<VendorQuotation>,
  ) {}

  async create(dto: CreateVendorQuotationDto, groupId?: string): Promise<VendorQuotation> {
    if (!groupId) groupId = randomUUID();
    const quotation = this.repo.create({
      groupId,
      projectId: dto.projectId,
      vendorId: dto.vendorId,
      items: dto.items,
      totalAmount: dto.totalAmount,
      materialRequirementId: dto.materialRequirementId,
      status: 'pending',
    });
    return this.repo.save(quotation);
  }

  async findAll() {
    return this.repo.find({
      where: { isDeleted: false },
      relations: ['project', 'vendor', 'materialRequirement'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const quotation = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: ['project', 'vendor', 'materialRequirement'],
    });
    if (!quotation) throw new NotFoundException('Vendor quotation not found');
    return quotation;
  }

  async update(id: string, dto: UpdateVendorQuotationDto): Promise<VendorQuotation> {
    const quotation = await this.findOne(id);
    Object.assign(quotation, dto);
    return this.repo.save(quotation);
  }

  async remove(id: string): Promise<void> {
    const quotation = await this.findOne(id);
    quotation.isDeleted = true;
    await this.repo.save(quotation);
  }

  async uploadFile(id: string, filename: string): Promise<VendorQuotation> {
    const quotation = await this.findOne(id);
    quotation.quotationUrl = `/uploads/vendor-quotations/${filename}`;
    quotation.quotationKey = filename;
    return this.repo.save(quotation);
  }
}
