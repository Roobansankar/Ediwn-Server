import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { Role } from '../common/enums.js';
import { CreateSiteEngineerDto } from './dto/create-site-engineer.dto.js';
import { UpdateSiteEngineerDto } from './dto/update-site-engineer.dto.js';
import { Project } from '../projects/entities/project.entity.js';

@Injectable()
export class SiteEngineersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(dto: CreateSiteEngineerDto) {
    if (dto.email) {
      // Login looks a user up by `email = x OR username = x`, so a new
      // email must not collide with anyone's existing username either —
      // otherwise the two accounts become ambiguous to log into.
      const existingEmail = await this.userRepository.findOne({
        where: [{ email: dto.email }, { username: dto.email }],
      });
      if (existingEmail) throw new ConflictException('Email already in use');
    }
    if (dto.username) {
      const existingUsername = await this.userRepository.findOne({
        where: [{ username: dto.username }, { email: dto.username }],
      });
      if (existingUsername)
        throw new ConflictException('Username already in use');
    }

    const engineer = this.userRepository.create({
      name: dto.name,
      email: dto.email || `${dto.username || 'user'}_${Date.now()}@temp.com`,
      username: dto.username,
      employeeId: dto.employeeId,
      phone: dto.phone,
      address: dto.address,
      role: Role.SITE_ENGINEER,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      salaryGradeId: dto.salaryGradeId,
    });

    if (dto.password) {
      engineer.passwordHash = await bcrypt.hash(dto.password, 10);
    } else {
      engineer.passwordHash = await bcrypt.hash('8220', 10); // Default password
    }

    if (dto.projectIds && dto.projectIds.length > 0) {
      engineer.projects = await this.projectRepository.findByIds(
        dto.projectIds,
      );
    } else {
      engineer.projects = [];
    }

    return await this.userRepository.save(engineer);
  }

  async findAll() {
    return await this.userRepository.find({
      where: { role: Role.SITE_ENGINEER },
      relations: ['projects', 'salaryGrade'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const engineer = await this.userRepository.findOne({
      where: { id, role: Role.SITE_ENGINEER },
      relations: ['projects', 'salaryGrade'],
    });
    if (!engineer) {
      throw new NotFoundException(`Site Engineer with ID ${id} not found`);
    }
    return engineer;
  }

  async update(id: string, dto: UpdateSiteEngineerDto) {
    const engineer = await this.findOne(id);

    if (dto.email && dto.email !== engineer.email) {
      const existingEmail = await this.userRepository.findOne({
        where: [{ email: dto.email }, { username: dto.email }],
      });
      if (existingEmail) throw new ConflictException('Email already in use');
    }
    if (dto.username && dto.username !== engineer.username) {
      const existingUsername = await this.userRepository.findOne({
        where: [{ username: dto.username }, { email: dto.username }],
      });
      if (existingUsername)
        throw new ConflictException('Username already in use');
    }

    if (dto.password) {
      engineer.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.projectIds !== undefined) {
      if (dto.projectIds.length > 0) {
        engineer.projects = await this.projectRepository.findByIds(
          dto.projectIds,
        );
      } else {
        engineer.projects = [];
      }
    }

    Object.assign(engineer, {
      name: dto.name !== undefined ? dto.name : engineer.name,
      email: dto.email !== undefined ? dto.email : engineer.email,
      username: dto.username !== undefined ? dto.username : engineer.username,
      employeeId:
        dto.employeeId !== undefined ? dto.employeeId : engineer.employeeId,
      phone: dto.phone !== undefined ? dto.phone : engineer.phone,
      address: dto.address !== undefined ? dto.address : engineer.address,
      isActive: dto.isActive !== undefined ? dto.isActive : engineer.isActive,
      salaryGradeId:
        dto.salaryGradeId !== undefined
          ? dto.salaryGradeId
          : engineer.salaryGradeId,
    });

    return await this.userRepository.save(engineer);
  }

  async remove(id: string) {
    const engineer = await this.findOne(id);
    engineer.isActive = false;
    return await this.userRepository.save(engineer);
  }
}
