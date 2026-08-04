import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseEnquiry } from './entities/purchase-enquiry.entity.js';
import { CreatePurchaseEnquiryDto } from './dto/create-purchase-enquiry.dto.js';
import { Role } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

type RequestUser = { id: string; role: string; name?: string };

@Injectable()
export class PurchaseEnquiriesService {
  constructor(
    @InjectRepository(PurchaseEnquiry)
    private repo: Repository<PurchaseEnquiry>,
    private readonly notifications: NotificationsService,
  ) {}

  private async generateEnquiryNo(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.repo
      .createQueryBuilder('pe')
      .where('pe.enquiryNo LIKE :prefix', { prefix: `MR-${year}-%` })
      .orderBy('pe.enquiryNo', 'DESC')
      .getOne();
    let seq = 1;
    if (last) {
      const parts = last.enquiryNo.split('-');
      seq = parseInt(parts[2], 10) + 1;
    }
    return `MR-${year}-${String(seq).padStart(3, '0')}`;
  }

  async create(
    dto: CreatePurchaseEnquiryDto,
    user?: RequestUser,
  ): Promise<PurchaseEnquiry> {
    const enquiryNo = await this.generateEnquiryNo();
    const enquiry = this.repo.create({
      enquiryNo,
      vendorId: dto.vendorId,
      projectId: dto.projectId,
      notes: dto.notes,
      items: dto.items,
      status: 'pending',
      createdBy: user?.id,
    });
    const saved = await this.repo.save(enquiry);

    if (user?.role === Role.SITE_ENGINEER) {
      await this.notifications.createForRole(Role.PURCHASE_TEAM, {
        userId: user.id,
        type: 'material_requirement_created',
        title: 'New Material Requirement',
        message: `${user.name || 'A site engineer'} created ${saved.enquiryNo}`,
        link: '/dashboard/material-requirement',
        entityId: saved.id,
      });
    }

    return saved;
  }

  async findAll(user?: any) {
    const where: any = { isDeleted: false };

    if (user?.role === Role.SITE_ENGINEER) {
      where.createdBy = user.id;
    }

    return this.repo.find({
      where,
      relations: ['vendor', 'project', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const enquiry = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: ['vendor', 'project', 'creator'],
    });
    if (!enquiry) throw new NotFoundException('Material Requirement not found');
    return enquiry;
  }

  async update(
    id: string,
    dto: CreatePurchaseEnquiryDto,
    userId?: string,
  ): Promise<PurchaseEnquiry> {
    const enquiry = await this.findOne(id);
    Object.assign(enquiry, {
      vendorId: dto.vendorId,
      projectId: dto.projectId,
      notes: dto.notes,
      items: dto.items,
      updatedBy: userId ?? '',
    });
    return this.repo.save(enquiry);
  }

  async updateStatus(
    id: string,
    status: string,
    user?: RequestUser,
  ): Promise<PurchaseEnquiry> {
    const enquiry = await this.findOne(id);
    enquiry.status = status;
    const saved = await this.repo.save(enquiry);

    if (saved.createdBy) {
      const label = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated';
      await this.notifications.createForUser(saved.createdBy, {
        userId: user?.id,
        type: 'material_requirement_status',
        title: 'Material Requirement Update',
        message: `${saved.enquiryNo} was ${label}${user?.name ? ` by ${user.name}` : ''}`,
        link: '/dashboard/material-requirement',
        entityId: saved.id,
      });
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const enquiry = await this.findOne(id);
    enquiry.isDeleted = true;
    await this.repo.save(enquiry);
  }
}
