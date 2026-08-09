import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  async create(dto: CreateTeamDto) {
    const existing = await this.teamRepo.findOne({
      where: { name: dto.name, isDeleted: false },
    });

    if (existing) {
      throw new ConflictException('Team already exists');
    }

    const team = this.teamRepo.create(dto);
    return await this.teamRepo.save(team);
  }

  async findAll() {
    return await this.teamRepo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateTeamDto) {
    const team = await this.teamRepo.findOne({ where: { id, isDeleted: false } });
    if (!team) throw new NotFoundException('Team not found');

    if (dto.name && dto.name !== team.name) {
      const existing = await this.teamRepo.findOne({
        where: { name: dto.name, isDeleted: false },
      });
      if (existing) throw new ConflictException('Team already exists');
    }

    Object.assign(team, dto);
    return await this.teamRepo.save(team);
  }

  async remove(id: string) {
    const team = await this.teamRepo.findOne({ where: { id } });
    if (team) {
      team.isDeleted = true;
      await this.teamRepo.save(team);
    }
    return { success: true };
  }
}
