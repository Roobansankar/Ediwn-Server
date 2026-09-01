import {
  Injectable,
  NotFoundException,
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

  async generateWoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastSwo = await this.repository
      .createQueryBuilder('swo')
      .where('swo.woNumber LIKE :prefix', { prefix: `SWO-${year}-%` })
      .orderBy('swo.woNumber', 'DESC')
      .getOne();
    let seq = 1;
    if (lastSwo) {
      const parts = lastSwo.woNumber.split('-');
      seq = parseInt(parts[2], 10) + 1;
    }
    return `SWO-${year}-${String(seq).padStart(3, '0')}`;
  }

  async create(dto: CreateSubcontractWorkOrderDto) {
    const woNumber = await this.generateWoNumber();
    const swo = this.repository.create({ ...dto, woNumber });
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

    // project/subcontractor/workCategory are eager-loaded by findOne(), so
    // they're still the old related entity here. If left in place, TypeORM
    // resolves the FK column from the stale relation object on save and
    // silently reverts the new *Id column set above by Object.assign.
    if (dto.projectId) delete (swo as any).project;
    if (dto.subcontractorId) delete (swo as any).subcontractor;
    if (dto.workCategoryId) delete (swo as any).workCategory;

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
