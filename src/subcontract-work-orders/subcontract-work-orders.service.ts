import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubcontractWorkOrder } from './entities/subcontract-work-order.entity.js';
import { CreateSubcontractWorkOrderDto } from './dto/create-subcontract-work-order.dto.js';
import { UpdateSubcontractWorkOrderDto } from './dto/update-subcontract-work-order.dto.js';

@Injectable()
export class SubcontractWorkOrdersService {
  constructor(
    @InjectRepository(SubcontractWorkOrder)
    private readonly repository: Repository<SubcontractWorkOrder>,
  ) {}

  async create(dto: CreateSubcontractWorkOrderDto) {
    const existing = await this.repository.findOne({
      where: { woNumber: dto.woNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Work Order with number ${dto.woNumber} already exists`,
      );
    }

    const swo = this.repository.create(dto);
    swo.amount = Number(dto.amount || 0);
    swo.gstAmount = (swo.amount * Number(dto.gstPercentage || 0)) / 100;
    swo.totalAmount = swo.amount + swo.gstAmount;
    return await this.repository.save(swo);
  }

  async findAll(subcontractorId?: string) {
    return await this.repository.find({
      where: {
        isDeleted: false,
        ...(subcontractorId ? { subcontractorId } : {}),
      },
      relations: ['project', 'subcontractor', 'workCategory'],
      order: { woNumber: 'DESC' },
    });
  }

  async findOne(id: string) {
    const swo = await this.repository.findOne({
      where: { id, isDeleted: false },
    });
    if (!swo) {
      throw new NotFoundException(
        `Subcontract Work Order with ID ${id} not found`,
      );
    }
    return swo;
  }

  async update(id: string, dto: UpdateSubcontractWorkOrderDto) {
    const swo = await this.findOne(id);
    Object.assign(swo, dto);
    swo.amount = Number(dto.amount ?? swo.amount ?? 0);
    swo.gstAmount = (swo.amount * Number(dto.gstPercentage ?? swo.gstPercentage)) / 100;
    swo.totalAmount = swo.amount + swo.gstAmount;
    return await this.repository.save(swo);
  }

  async updateStatus(id: string, status: string) {
    const swo = await this.findOne(id);
    swo.status = status as any;
    return await this.repository.save(swo);
  }

  async remove(id: string) {
    const swo = await this.findOne(id);
    swo.isDeleted = true;
    return await this.repository.save(swo);
  }
}
