import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { Role } from '../common/enums.js';
import { CreateAccountsManagerDto } from './dto/create-accounts-manager.dto.js';
import { UpdateAccountsManagerDto } from './dto/update-accounts-manager.dto.js';
import { Project } from '../projects/entities/project.entity.js';

@Injectable()
export class AccountsManagersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(dto: CreateAccountsManagerDto) {
    if (dto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) throw new ConflictException('Email already in use');
    }
    if (dto.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUsername)
        throw new ConflictException('Username already in use');
    }

    const manager = this.userRepository.create({
      name: dto.name,
      email: dto.email || `${dto.username || 'user'}_${Date.now()}@temp.com`,
      username: dto.username,
      employeeId: dto.employeeId,
      phone: dto.phone,
      address: dto.address,
      role: Role.ACCOUNTS_MANAGER,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      salaryGradeId: dto.salaryGradeId,
    });

    if (dto.password) {
      manager.passwordHash = await bcrypt.hash(dto.password, 10);
    } else {
      manager.passwordHash = await bcrypt.hash('8220', 10); // Default password
    }

    if (dto.projectIds && dto.projectIds.length > 0) {
      manager.projects = await this.projectRepository.findBy({
        id: In(dto.projectIds),
      });
    } else {
      manager.projects = [];
    }

    return await this.userRepository.save(manager);
  }

  async findAll() {
    return await this.userRepository.find({
      where: { role: Role.ACCOUNTS_MANAGER },
      relations: ['projects', 'salaryGrade'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const manager = await this.userRepository.findOne({
      where: { id, role: Role.ACCOUNTS_MANAGER },
      relations: ['projects', 'salaryGrade'],
    });
    if (!manager) {
      throw new NotFoundException(`Accounts Manager with ID ${id} not found`);
    }
    return manager;
  }

  async update(id: string, dto: UpdateAccountsManagerDto) {
    const manager = await this.findOne(id);

    if (dto.email && dto.email !== manager.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) throw new ConflictException('Email already in use');
    }
    if (dto.username && dto.username !== manager.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUsername)
        throw new ConflictException('Username already in use');
    }

    if (dto.password) {
      manager.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.projectIds !== undefined) {
      if (dto.projectIds.length > 0) {
        manager.projects = await this.projectRepository.findBy({
          id: In(dto.projectIds),
        });
      } else {
        manager.projects = [];
      }
    }

    Object.assign(manager, {
      name: dto.name !== undefined ? dto.name : manager.name,
      email: dto.email !== undefined ? dto.email : manager.email,
      username: dto.username !== undefined ? dto.username : manager.username,
      employeeId:
        dto.employeeId !== undefined ? dto.employeeId : manager.employeeId,
      phone: dto.phone !== undefined ? dto.phone : manager.phone,
      address: dto.address !== undefined ? dto.address : manager.address,
      isActive: dto.isActive !== undefined ? dto.isActive : manager.isActive,
      salaryGradeId:
        dto.salaryGradeId !== undefined
          ? dto.salaryGradeId
          : manager.salaryGradeId,
    });

    return await this.userRepository.save(manager);
  }

  async remove(id: string) {
    const manager = await this.findOne(id);
    return await this.userRepository.remove(manager);
  }
}
