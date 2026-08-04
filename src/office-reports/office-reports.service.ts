import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfficeReport } from './entities/office-report.entity.js';

export const DEFAULT_REPORT_CATEGORIES = [
  'MOM',
  'Project report',
  'Test report',
  'Consultant report',
  'Client report',
  'Schedule',
];

export type CreateReportData = {
  category: string;
  title: string;
  description?: string;
  projectId?: string;
  fileUrl: string;
  fileKey: string;
  uploadedBy: string;
};

@Injectable()
export class OfficeReportsService {
  constructor(
    @InjectRepository(OfficeReport)
    private readonly reportsRepository: Repository<OfficeReport>,
  ) {}

  async create(data: CreateReportData): Promise<OfficeReport> {
    const report = this.reportsRepository.create({
      ...data,
      projectId: data.projectId || undefined,
      description: data.description || undefined,
    });
    return this.reportsRepository.save(report);
  }

  async findAll(): Promise<OfficeReport[]> {
    return this.reportsRepository.find({
      where: { isDeleted: false },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findCategories(): Promise<string[]> {
    const rows = await this.reportsRepository
      .createQueryBuilder('report')
      .select('DISTINCT report.category', 'category')
      .where('report."isDeleted" = :isDeleted', { isDeleted: false })
      .getRawMany<{ category: string }>();

    const existing = rows.map((row) => row.category).filter(Boolean);
    return Array.from(new Set([...DEFAULT_REPORT_CATEGORIES, ...existing]));
  }

  async remove(id: string, userId: string) {
    const report = await this.reportsRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    report.isDeleted = true;
    return this.reportsRepository.save(report);
  }
}
