import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DprReport } from './entities/dpr-report.entity.js';
import { Role } from '../common/enums.js';

@Injectable()
export class DprService {
  constructor(
    @InjectRepository(DprReport)
    private dprRepo: Repository<DprReport>,
  ) {}

  async create(data: Partial<DprReport>): Promise<DprReport> {
    const report = this.dprRepo.create(data);
    return this.dprRepo.save(report);
  }

  async findAll(
    query: {
      projectId?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    },
    user?: any,
  ) {
    const { projectId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    console.log('DPR Filter Query:', { projectId, dateFrom, dateTo });

    const qb = this.dprRepo
      .createQueryBuilder('dpr')
      .leftJoinAndSelect('dpr.project', 'project')
      .where('dpr.isDeleted = false');

    if (projectId && projectId !== 'undefined' && projectId !== '') {
      qb.andWhere('dpr.projectId = :projectId', { projectId });
    }

    if (dateFrom && dateFrom !== '' && dateFrom !== 'undefined') {
      const fromDate = new Date(dateFrom);
      if (!isNaN(fromDate.getTime())) {
        qb.andWhere('dpr.reportDate >= :dateFromFormatted', {
          dateFromFormatted: fromDate.toISOString().split('T')[0],
        });
      }
    }

    if (dateTo && dateTo !== '' && dateTo !== 'undefined') {
      const toDate = new Date(dateTo);
      if (!isNaN(toDate.getTime())) {
        qb.andWhere('dpr.reportDate <= :dateToFormatted', {
          dateToFormatted: toDate.toISOString().split('T')[0],
        });
      }
    }

    // Site engineers only see their own reports
    if (user && user.role === Role.SITE_ENGINEER) {
      qb.andWhere('dpr.uploadedBy = :userId', { userId: user.id });
    }

    qb.orderBy('dpr.reportDate', 'DESC');
    qb.addOrderBy('dpr.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    console.log('SQL Query:', qb.getSql());
    console.log('SQL Parameters:', qb.getParameters());

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<DprReport> {
    const report = await this.dprRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['project'],
    });
    if (!report) throw new NotFoundException('DPR Report not found');
    return report;
  }

  async softDelete(id: string): Promise<void> {
    await this.dprRepo.update(id, { isDeleted: true });
  }
}
