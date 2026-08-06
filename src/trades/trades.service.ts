import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from './entities/trade.entity.js';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepo: Repository<Trade>,
  ) {}

  async create(dto: CreateTradeDto) {
    const existing = await this.tradeRepo.findOne({
      where: { name: dto.name, isDeleted: false },
    });

    if (existing) {
      throw new ConflictException('Trade already exists');
    }

    const trade = this.tradeRepo.create(dto);
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

    if (dto.name && dto.name !== trade.name) {
      const existing = await this.tradeRepo.findOne({
        where: { name: dto.name, isDeleted: false },
      });
      if (existing) throw new ConflictException('Trade already exists');
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
