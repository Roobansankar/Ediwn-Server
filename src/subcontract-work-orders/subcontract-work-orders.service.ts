import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubcontractWorkOrder } from './entities/subcontract-work-order.entity.js';
import { CreateSubcontractWorkOrderDto } from './dto/create-subcontract-work-order.dto.js';
import { UpdateSubcontractWorkOrderDto } from './dto/update-subcontract-work-order.dto.js';
import { Role } from '../common/enums.js';
import { Payment } from '../payments/entities/payment.entity.js';

@Injectable()
export class SubcontractWorkOrdersService {
  constructor(
    @InjectRepository(SubcontractWorkOrder)
    private readonly repository: Repository<SubcontractWorkOrder>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
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
    const swos = await this.repository.find({
      where: {
        isDeleted: false,
        ...(subcontractorId ? { subcontractorId } : {}),
      },
      relations: ['project', 'subcontractor', 'workCategory'],
      order: { woNumber: 'DESC' },
    });
    if (swos.length === 0) return swos;

    const paidRows = await this.paymentRepo
      .createQueryBuilder('p')
      .select('p.subcontractWorkOrderId', 'subcontractWorkOrderId')
      .addSelect('SUM(p.amount)', 'total')
      .where('p.isDeleted = false')
      .andWhere('p.subcontractWorkOrderId IN (:...ids)', {
        ids: swos.map((swo) => swo.id),
      })
      .groupBy('p.subcontractWorkOrderId')
      .getRawMany<{ subcontractWorkOrderId: string; total: string }>();
    const paidBySwo = new Map(
      paidRows.map((r) => [r.subcontractWorkOrderId, Number(r.total)]),
    );

    return swos.map((swo) =>
      Object.assign(swo, { paidAmount: paidBySwo.get(swo.id) || 0 }),
    );
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

  async updateStatus(id: string, status: string, userRole?: string) {
    if (userRole === Role.PURCHASE_TEAM && status === 'admin_approved') {
      throw new ForbiddenException(
        'Purchase team cannot set admin approval on their own work orders',
      );
    }
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
