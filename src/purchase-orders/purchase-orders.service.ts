import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { PoItem } from './entities/po-item.entity.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { PurchaseOrderStatus } from '../common/enums.js';
import { PurchaseEnquiry } from '../purchase-enquiries/entities/purchase-enquiry.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';

type RequestUser = { id: string; role: string; name?: string };

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PoItem) private poItemRepo: Repository<PoItem>,
    @InjectRepository(PurchaseEnquiry)
    private purchaseEnquiryRepo: Repository<PurchaseEnquiry>,
    private readonly notifications: NotificationsService,
  ) {}

  private async generatePoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPo = await this.poRepo
      .createQueryBuilder('po')
      .where('po.poNumber LIKE :prefix', { prefix: `PO-${year}-%` })
      .orderBy('po.poNumber', 'DESC')
      .getOne();
    let seq = 1;
    if (lastPo) {
      const parts = lastPo.poNumber.split('-');
      seq = parseInt(parts[2], 10) + 1;
    }
    return `PO-${year}-${String(seq).padStart(3, '0')}`;
  }

  async create(
    dto: CreatePurchaseOrderDto,
    userId?: string,
  ): Promise<PurchaseOrder> {
    const poNumber = await this.generatePoNumber();
    const items = dto.items.map((item) => {
      const amount = item.quantity * item.rate;
      return this.poItemRepo.create({
        ...item,
        unit: item.unit || 'nos',
        amount,
      });
    });
    const basicAmount = items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const gstPercent = dto.gstPercent || 0;
    const gstAmount = Number((basicAmount * gstPercent / 100).toFixed(2));
    const totalWithGst = Number((basicAmount + gstAmount).toFixed(2));
    const po = this.poRepo.create({
      poNumber,
      vendorId: dto.vendorId,
      projectId: dto.projectId,
      materialRequirementNo: dto.materialRequirementNo,
      paymentTerms: dto.paymentTerms,
      billFileUrl: dto.billFileUrl,
      billFileKey: dto.billFileKey,
      totalAmount: basicAmount,
      gstPercent,
      gstAmount,
      totalWithGst,
      items,
      createdBy: userId,
    });
    return this.poRepo.save(po);
  }

  async findAll() {
    return this.poRepo.find({
      where: { isDeleted: false },
      relations: ['vendor', 'items', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const po = await this.poRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['vendor', 'items', 'project'],
    });
    if (!po) throw new NotFoundException('Purchase Order not found');
    return po;
  }

  async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    user?: RequestUser,
  ): Promise<PurchaseOrder> {
    try {
      const po = await this.findOne(id);
      po.status = status;
      const saved = await this.poRepo.save(po);

      if (status === PurchaseOrderStatus.APPROVED && saved.materialRequirementNo) {
        const mr = await this.purchaseEnquiryRepo.findOne({
          where: { enquiryNo: saved.materialRequirementNo, isDeleted: false },
        });
        if (mr?.createdBy) {
          await this.notifications.createForUser(mr.createdBy, {
            userId: user?.id,
            type: 'purchase_order_approved',
            title: 'Purchase Order Approved',
            message: `${mr.enquiryNo} against ${saved.poNumber} — purchase order created and approved${user?.name ? ` by ${user.name}` : ''}`,
            link: '/dashboard/material-requirement',
            entityId: saved.id,
          });
        }
      }

      return saved;
    } catch (error) {
      console.error('Error updating PO status:', error);
      if (error.code === '22P02') {
        // Postgres invalid text representation (often enum error)
        throw new Error(
          `Database rejected status '${status}'. Please ensure the database schema is updated.`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: any, userId?: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);

    if (dto.items) {
      // Remove old items
      await this.poItemRepo.delete({ purchaseOrderId: id });

      // Create new items
      const items = dto.items.map((item: any) => {
        const amount = item.quantity * item.rate;
        return this.poItemRepo.create({
          purchaseOrderId: id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'nos',
          rate: item.rate,
          amount,
        });
      });
      po.items = await this.poItemRepo.save(items);
    }

    Object.assign(po, {
      ...dto,
      items: po.items,
      updatedBy: userId ?? '',
    });

    // Recalculate total
    const basicAmount = po.items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const gstPercent = Number(po.gstPercent) || 0;
    const gstAmount = Number((basicAmount * gstPercent / 100).toFixed(2));
    po.totalAmount = basicAmount;
    po.gstAmount = gstAmount;
    po.totalWithGst = Number((basicAmount + gstAmount).toFixed(2));

    return this.poRepo.save(po);
  }

  async remove(id: string): Promise<void> {
    const po = await this.findOne(id);
    po.isDeleted = true;
    await this.poRepo.save(po);
  }
}
