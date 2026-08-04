import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialReceived } from './entities/material-received.entity.js';
import { CreateMaterialReceivedDto } from './dto/create-material-received.dto.js';
import { Role } from '../common/enums.js';

type RequestUser = { id: string; role: string; name?: string };

@Injectable()
export class MaterialReceivedService {
  constructor(
    @InjectRepository(MaterialReceived)
    private repo: Repository<MaterialReceived>,
  ) {}

  private async generateMrNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.repo
      .createQueryBuilder('mr')
      .where('mr.mrNumber LIKE :prefix', { prefix: `MRN-${year}-%` })
      .orderBy('mr.mrNumber', 'DESC')
      .getOne();
    let seq = 1;
    if (last) {
      const parts = last.mrNumber.split('-');
      seq = parseInt(parts[2], 10) + 1;
    }
    return `MRN-${year}-${String(seq).padStart(3, '0')}`;
  }

  async create(
    dto: CreateMaterialReceivedDto,
    user?: RequestUser,
  ): Promise<MaterialReceived> {
    const mrNumber = await this.generateMrNumber();
    const entry = this.repo.create({
      mrNumber,
      projectId: dto.projectId,
      purchaseOrderId: dto.purchaseOrderId,
      receivedDate: dto.receivedDate,
      notes: dto.notes,
      items: dto.items || [],
      photoUrls: dto.photoUrls || [],
      photoKeys: dto.photoKeys || [],
      billUrl: dto.billUrl,
      billKey: dto.billKey,
      status: 'pending',
      createdBy: user?.id,
    });
    return this.repo.save(entry);
  }

  async findAll(user?: any) {
    const where: any = { isDeleted: false };

    if (user?.role === Role.SITE_ENGINEER) {
      where.createdBy = user.id;
    }

    return this.repo.find({
      where,
      relations: ['project', 'creator', 'purchaseOrder'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const entry = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: ['project', 'creator', 'purchaseOrder'],
    });
    if (!entry)
      throw new NotFoundException('Material Received record not found');
    return entry;
  }

  async update(
    id: string,
    dto: Partial<CreateMaterialReceivedDto>,
    userId?: string,
  ): Promise<MaterialReceived> {
    const entry = await this.findOne(id);
    Object.assign(entry, {
      projectId: dto.projectId ?? entry.projectId,
      purchaseOrderId: dto.purchaseOrderId ?? entry.purchaseOrderId,
      receivedDate: dto.receivedDate ?? entry.receivedDate,
      notes: dto.notes ?? entry.notes,
      items: dto.items ?? entry.items,
      photoUrls: dto.photoUrls ?? entry.photoUrls,
      photoKeys: dto.photoKeys ?? entry.photoKeys,
      billUrl: dto.billUrl ?? entry.billUrl,
      billKey: dto.billKey ?? entry.billKey,
      updatedBy: userId ?? '',
    });
    return this.repo.save(entry);
  }

  async updateStatus(id: string, status: string): Promise<MaterialReceived> {
    const entry = await this.findOne(id);
    entry.status = status;
    return this.repo.save(entry);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    entry.isDeleted = true;
    await this.repo.save(entry);
  }
}
