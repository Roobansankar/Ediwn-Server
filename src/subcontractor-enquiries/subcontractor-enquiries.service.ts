import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { SubcontractorEnquiry } from './entities/subcontractor-enquiry.entity.js';
import { CreateSubcontractorEnquiryDto } from './dto/create-subcontractor-enquiry.dto.js';
import { UpdateSubcontractorEnquiryDto } from './dto/update-subcontractor-enquiry.dto.js';

type RequestUser = { id: string; role: string; name?: string };

@Injectable()
export class SubcontractorEnquiriesService {
  constructor(
    @InjectRepository(SubcontractorEnquiry)
    private repo: Repository<SubcontractorEnquiry>,
  ) {}

  // Numeric-safe sequence (not a plain string ORDER BY, which breaks once a
  // year passes 999 - e.g. "SCR-2026-1000" sorts before "SCR-2026-999").
  private async generateScrNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SCR-${year}-`;
    const result = await this.repo
      .createQueryBuilder('se')
      .select("MAX(CAST(SPLIT_PART(se.scrNo, '-', 3) AS INTEGER))", 'maxSeq')
      .where('se.scrNo LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne<{ maxSeq: string | null }>();
    const seq = (result?.maxSeq ? parseInt(result.maxSeq, 10) : 0) + 1;
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  async create(
    dto: CreateSubcontractorEnquiryDto,
    user?: RequestUser,
  ): Promise<SubcontractorEnquiry> {
    let groupId = dto.groupId;
    let scrNo: string;
    if (groupId) {
      const existing = await this.repo.findOne({ where: { groupId, isDeleted: false } });
      if (!existing) throw new NotFoundException('Enquiry group not found');
      scrNo = existing.scrNo;
    } else {
      groupId = randomUUID();
      scrNo = await this.generateScrNo();
    }

    const basicAmount = dto.totalAmount || 0;
    const gstPercent = dto.gstPercent || 0;
    const gstAmount = Number(((basicAmount * gstPercent) / 100).toFixed(2));

    const entry = this.repo.create({
      groupId,
      scrNo,
      projectId: dto.projectId,
      workCategoryId: dto.workCategoryId,
      subcontractorId: dto.subcontractorId,
      scopeOfWork: dto.scopeOfWork,
      totalAmount: dto.totalAmount,
      gstPercent: dto.gstPercent,
      gstAmount,
      totalWithGst: Number((basicAmount + gstAmount).toFixed(2)),
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      status: 'pending',
      createdBy: user?.id,
    });
    return this.repo.save(entry);
  }

  async findAll() {
    return this.repo.find({
      where: { isDeleted: false },
      relations: ['project', 'workCategory', 'subcontractor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const entry = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: ['project', 'workCategory', 'subcontractor'],
    });
    if (!entry) throw new NotFoundException('Subcontractor enquiry not found');
    return entry;
  }

  async update(id: string, dto: UpdateSubcontractorEnquiryDto): Promise<SubcontractorEnquiry> {
    const entry = await this.findOne(id);
    Object.assign(entry, {
      projectId: dto.projectId ?? entry.projectId,
      workCategoryId: dto.workCategoryId ?? entry.workCategoryId,
      subcontractorId: dto.subcontractorId ?? entry.subcontractorId,
      scopeOfWork: dto.scopeOfWork ?? entry.scopeOfWork,
      totalAmount: dto.totalAmount ?? entry.totalAmount,
      gstPercent: dto.gstPercent ?? entry.gstPercent,
      startDate: dto.startDate ?? entry.startDate,
      endDate: dto.endDate ?? entry.endDate,
      status: dto.status ?? entry.status,
    });

    if (dto.totalAmount !== undefined || dto.gstPercent !== undefined) {
      const basicAmount = Number(entry.totalAmount) || 0;
      const gstPercent = Number(entry.gstPercent) || 0;
      const gstAmount = Number(((basicAmount * gstPercent) / 100).toFixed(2));
      entry.gstAmount = gstAmount;
      entry.totalWithGst = Number((basicAmount + gstAmount).toFixed(2));
    }

    return this.repo.save(entry);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    entry.isDeleted = true;
    await this.repo.save(entry);
  }

  async uploadFile(id: string, filename: string): Promise<SubcontractorEnquiry> {
    const entry = await this.findOne(id);
    entry.quotationUrl = `/uploads/subcontractor-enquiries/${filename}`;
    entry.quotationKey = filename;
    return this.repo.save(entry);
  }
}
