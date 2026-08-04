import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from './entities/work-order.entity.js';
import { WorkOrderItem } from './entities/work-order-item.entity.js';
import { Vendor } from '../vendors/entities/vendor.entity.js';
import { CreateWorkOrderDto } from './dto/create-work-order.dto.js';
import { WorkOrderStatus } from '../common/enums.js';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder) private woRepo: Repository<WorkOrder>,
    @InjectRepository(WorkOrderItem)
    private woItemRepo: Repository<WorkOrderItem>,
    @InjectRepository(Vendor) private vendorRepo: Repository<Vendor>,
  ) {}

  private async generateWoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastWo = await this.woRepo
      .createQueryBuilder('wo')
      .where('wo.woNumber LIKE :prefix', { prefix: `WO-${year}-%` })
      .orderBy('wo.woNumber', 'DESC')
      .getOne();

    let seq = 1;
    if (lastWo) {
      const parts = lastWo.woNumber.split('-');
      seq = parseInt(parts[2], 10) + 1;
    }
    return `WO-${year}-${String(seq).padStart(3, '0')}`;
  }

  async create(dto: CreateWorkOrderDto, userId?: string): Promise<WorkOrder> {
    const vendor = await this.vendorRepo.findOne({
      where: { id: dto.vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const woNumber = await this.generateWoNumber();

    // Calculate line item amounts
    const items = dto.items.map((item) => {
      const amount = item.quantity * item.rate;
      return this.woItemRepo.create({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'nos',
        rate: item.rate,
        amount,
      });
    });

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    // GST calculation (18% default, split based on state)
    const gstRate = 0.18;
    const gstAmount = totalAmount * gstRate;
    const companyState = 'Tamil Nadu'; // Edwin Constructions home state

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (
      vendor.state &&
      vendor.state.toLowerCase() === companyState.toLowerCase()
    ) {
      cgstAmount = gstAmount / 2;
      sgstAmount = gstAmount / 2;
    } else {
      igstAmount = gstAmount;
    }

    const workOrder = this.woRepo.create({
      woNumber,
      vendorId: dto.vendorId,
      projectId: dto.projectId,
      terms: dto.terms,
      totalAmount,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      items,
      createdBy: userId,
    });

    return this.woRepo.save(workOrder);
  }

  async findAll(query: {
    status?: WorkOrderStatus;
    projectId?: string;
    vendorId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, projectId, vendorId, page = 1, limit = 20 } = query;
    const qb = this.woRepo
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.vendor', 'vendor')
      .leftJoinAndSelect('wo.project', 'project')
      .leftJoinAndSelect('wo.items', 'items')
      .where('wo.isDeleted = false');

    if (status) qb.andWhere('wo.status = :status', { status });
    if (projectId) qb.andWhere('wo.projectId = :projectId', { projectId });
    if (vendorId) qb.andWhere('wo.vendorId = :vendorId', { vendorId });

    qb.orderBy('wo.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<WorkOrder> {
    const wo = await this.woRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['vendor', 'items', 'project'],
    });
    if (!wo) throw new NotFoundException('Work Order not found');
    return wo;
  }

  async updateStatus(
    id: string,
    status: WorkOrderStatus,
    userId?: string,
  ): Promise<WorkOrder> {
    const wo = await this.findOne(id);
    wo.status = status;
    wo.updatedBy = userId ?? '';
    return this.woRepo.save(wo);
  }

  async update(id: string, dto: any, userId?: string): Promise<WorkOrder> {
    const wo = await this.findOne(id);
    const vendor = await this.vendorRepo.findOne({
      where: { id: dto.vendorId || wo.vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (dto.items) {
      // Remove old items
      await this.woItemRepo.delete({ workOrderId: id });

      // Create new items
      const items = dto.items.map((item: any) => {
        const amount = item.quantity * item.rate;
        return this.woItemRepo.create({
          workOrderId: id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'nos',
          rate: item.rate,
          amount,
        });
      });
      wo.items = await this.woItemRepo.save(items);
    }

    Object.assign(wo, {
      ...dto,
      items: wo.items,
      updatedBy: userId ?? '',
    });

    // Recalculate totals
    wo.totalAmount = wo.items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const gstRate = 0.18;
    wo.gstAmount = wo.totalAmount * gstRate;
    const companyState = 'Tamil Nadu';

    if (
      vendor.state &&
      vendor.state.toLowerCase() === companyState.toLowerCase()
    ) {
      wo.cgstAmount = wo.gstAmount / 2;
      wo.sgstAmount = wo.gstAmount / 2;
      wo.igstAmount = 0;
    } else {
      wo.igstAmount = wo.gstAmount;
      wo.cgstAmount = 0;
      wo.sgstAmount = 0;
    }

    return this.woRepo.save(wo);
  }

  async remove(id: string): Promise<void> {
    const wo = await this.findOne(id);
    wo.isDeleted = true;
    await this.woRepo.save(wo);
  }
}
