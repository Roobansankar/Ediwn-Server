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
import { CreatePurchaseTeamDto } from './dto/create-purchase-team.dto.js';
import { UpdatePurchaseTeamDto } from './dto/update-purchase-team.dto.js';
import { Project } from '../projects/entities/project.entity.js';
import { Salary } from '../salaries/entities/salary.entity.js';

@Injectable()
export class PurchaseTeamService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Salary)
    private readonly salaryRepository: Repository<Salary>,
  ) {}

  async create(dto: CreatePurchaseTeamDto) {
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

    const member = this.userRepository.create({
      name: dto.name,
      email: dto.email || `${dto.username || 'user'}_${Date.now()}@temp.com`,
      username: dto.username,
      employeeId: dto.employeeId,
      phone: dto.phone,
      address: dto.address,
      role: Role.PURCHASE_TEAM,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    if (dto.password) {
      member.passwordHash = await bcrypt.hash(dto.password, 10);
    } else {
      member.passwordHash = await bcrypt.hash('8220', 10); // Default password
    }

    if (dto.projectIds && dto.projectIds.length > 0) {
      member.projects = await this.projectRepository.findBy({
        id: In(dto.projectIds),
      });
    } else {
      member.projects = [];
    }

    member.salaryGradeId = dto.salaryGradeId || null;

    return await this.userRepository.save(member);
  }

  async findAll() {
    return await this.userRepository.find({
      where: { role: Role.PURCHASE_TEAM },
      relations: ['projects', 'salaryGrade'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const member = await this.userRepository.findOne({
      where: { id, role: Role.PURCHASE_TEAM },
      relations: ['projects', 'salaryGrade'],
    });
    if (!member) {
      throw new NotFoundException(
        `Purchase Team Member with ID ${id} not found`,
      );
    }
    return member;
  }

  async update(id: string, dto: UpdatePurchaseTeamDto) {
    const member = await this.findOne(id);

    if (dto.email && dto.email !== member.email) {
      const existingEmail = await this.userRepository.findOne({
        where: [{ email: dto.email }, { username: dto.email }],
      });
      if (existingEmail) throw new ConflictException('Email already in use');
    }
    if (dto.username && dto.username !== member.username) {
      const existingUsername = await this.userRepository.findOne({
        where: [{ username: dto.username }, { email: dto.username }],
      });
      if (existingUsername)
        throw new ConflictException('Username already in use');
    }

    if (dto.password) {
      member.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.projectIds !== undefined) {
      if (dto.projectIds.length > 0) {
        member.projects = await this.projectRepository.findBy({
          id: In(dto.projectIds),
        });
      } else {
        member.projects = [];
      }
    }

    Object.assign(member, {
      name: dto.name !== undefined ? dto.name : member.name,
      email: dto.email !== undefined ? dto.email : member.email,
      username: dto.username !== undefined ? dto.username : member.username,
      employeeId:
        dto.employeeId !== undefined ? dto.employeeId : member.employeeId,
      phone: dto.phone !== undefined ? dto.phone : member.phone,
      address: dto.address !== undefined ? dto.address : member.address,
      isActive: dto.isActive !== undefined ? dto.isActive : member.isActive,
      salaryGradeId:
        dto.salaryGradeId !== undefined
          ? dto.salaryGradeId
          : member.salaryGradeId,
    });

    return await this.userRepository.save(member);
  }

  async remove(id: string) {
    const member = await this.findOne(id);
    return await this.userRepository.remove(member);
  }
}
