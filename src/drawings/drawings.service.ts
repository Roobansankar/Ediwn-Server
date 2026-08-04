import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Drawing } from './entities/drawing.entity.js';
import { DrawingCategory, Role } from '../common/enums.js';

@Injectable()
export class DrawingsService {
  constructor(
    @InjectRepository(Drawing)
    private drawingsRepo: Repository<Drawing>,
  ) {}

  async create(data: Partial<Drawing>): Promise<Drawing> {
    const drawing = this.drawingsRepo.create(data);
    return this.drawingsRepo.save(drawing);
  }

  async findAll(
    query: {
      projectId?: string;
      category?: DrawingCategory;
      revision?: string;
    },
    user?: any,
  ) {
    const qb = this.drawingsRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.project', 'project')
      .where('d.isDeleted = false');

    if (query.projectId)
      qb.andWhere('d.projectId = :projectId', { projectId: query.projectId });
    if (query.category)
      qb.andWhere('d.category = :category', { category: query.category });
    if (query.revision)
      qb.andWhere('d.revision = :revision', { revision: query.revision });

    // Site engineers only see their own uploads
    if (user && user.role === Role.SITE_ENGINEER) {
      qb.andWhere('d.uploadedBy = :userId', { userId: user.id });
    }

    return qb.orderBy('d.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Drawing> {
    const drawing = await this.drawingsRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['project'],
    });
    if (!drawing) throw new NotFoundException('Drawing not found');
    return drawing;
  }

  async update(id: string, data: Partial<Drawing>): Promise<Drawing> {
    const drawing = await this.findOne(id);

    // Delete old file if new one is uploaded
    if (data.fileUrl && drawing.fileUrl && data.fileUrl !== drawing.fileUrl) {
      const oldPath = `.${drawing.fileUrl}`;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    Object.assign(drawing, data);
    return this.drawingsRepo.save(drawing);
  }

  async softDelete(id: string): Promise<void> {
    await this.drawingsRepo.update(id, { isDeleted: true });
  }
}
