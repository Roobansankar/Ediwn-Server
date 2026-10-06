import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Trade } from './entities/trade.entity.js';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepo: Repository<Trade>,
  ) {}

  // Names only have to be unique within a team (a trade with no team is
  // checked against the other trades with no team).
  private async assertNameFree(name: string, teamId: string | null, exceptId?: string) {
    const existing = await this.tradeRepo.findOne({
      where: { name, teamId: teamId ?? IsNull(), isDeleted: false },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`A trade named "${name}" already exists for this team`);
    }
  }

  async create(dto: CreateTradeDto) {
    const teamId = dto.teamId || null;
    await this.assertNameFree(dto.name, teamId);

    const trade = this.tradeRepo.create({ ...dto, teamId });
    return await this.tradeRepo.save(trade);
  }

  async findAll() {
    return await this.tradeRepo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateTradeDto) {
    const trade = await this.tradeRepo.findOne({ where: { id, isDeleted: false } });
    if (!trade) throw new NotFoundException('Trade not found');

    if (dto.name !== undefined || dto.teamId !== undefined) {
      const name = dto.name ?? trade.name;
      const teamId = dto.teamId !== undefined ? dto.teamId || null : trade.teamId;
      await this.assertNameFree(name, teamId, id);
    }

    Object.assign(trade, dto);
    return await this.tradeRepo.save(trade);
  }

  async remove(id: string) {
    const trade = await this.tradeRepo.findOne({ where: { id } });
    if (trade) {
      trade.isDeleted = true;
      await this.tradeRepo.save(trade);
    }
    return { success: true };
  }
}
