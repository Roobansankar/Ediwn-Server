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
import { CreateOfficeStaffDto } from './dto/create-office-staff.dto.js';
import { UpdateOfficeStaffDto } from './dto/update-office-staff.dto.js';
import { Project } from '../projects/entities/project.entity.js';

@Injectable()
export class OfficeStaffService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(dto: CreateOfficeStaffDto) {
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

    const staff = this.userRepository.create({
      name: dto.name,
      email: dto.email || `${dto.username || 'staff'}_${Date.now()}@temp.com`,
      username: dto.username,
      employeeId: dto.employeeId,
      phone: dto.phone,
      address: dto.address,
      staffType: dto.staffType,
      role: Role.OFFICE_STAFF,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      salaryGradeId: dto.salaryGradeId,
    });

    if (dto.password) {
      staff.passwordHash = await bcrypt.hash(dto.password, 10);
    } else {
      staff.passwordHash = await bcrypt.hash('8220', 10); // Default password
    }

    if (dto.projectIds && dto.projectIds.length > 0) {
      staff.projects = await this.projectRepository.findByIds(dto.projectIds);
    } else {
      staff.projects = [];
    }

    return await this.userRepository.save(staff);
  }

  async findAll() {
    return await this.userRepository.find({
      where: { role: Role.OFFICE_STAFF },
      relations: ['projects', 'salaryGrade'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const staff = await this.userRepository.findOne({
      where: { id, role: Role.OFFICE_STAFF },
      relations: ['projects', 'salaryGrade'],
    });
    if (!staff) {
      throw new NotFoundException(`Office staff with ID ${id} not found`);
    }
    return staff;
  }

  async update(id: string, dto: UpdateOfficeStaffDto) {
    const staff = await this.findOne(id);

    if (dto.email && dto.email !== staff.email) {
      const existingEmail = await this.userRepository.findOne({
        where: [{ email: dto.email }, { username: dto.email }],
      });
      if (existingEmail) throw new ConflictException('Email already in use');
    }
    if (dto.username && dto.username !== staff.username) {
      const existingUsername = await this.userRepository.findOne({
        where: [{ username: dto.username }, { email: dto.username }],
      });
      if (existingUsername)
        throw new ConflictException('Username already in use');
    }

    if (dto.password) {
      staff.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.projectIds !== undefined) {
      if (dto.projectIds.length > 0) {
        staff.projects = await this.projectRepository.findByIds(dto.projectIds);
      } else {
        staff.projects = [];
      }
    }

    Object.assign(staff, {
      name: dto.name !== undefined ? dto.name : staff.name,
      email: dto.email !== undefined ? dto.email : staff.email,
      username: dto.username !== undefined ? dto.username : staff.username,
      employeeId:
        dto.employeeId !== undefined ? dto.employeeId : staff.employeeId,
      phone: dto.phone !== undefined ? dto.phone : staff.phone,
      address: dto.address !== undefined ? dto.address : staff.address,
      staffType: dto.staffType !== undefined ? dto.staffType : staff.staffType,
      isActive: dto.isActive !== undefined ? dto.isActive : staff.isActive,
      salaryGradeId:
        dto.salaryGradeId !== undefined
          ? dto.salaryGradeId
          : staff.salaryGradeId,
    });

    return await this.userRepository.save(staff);
  }

  async remove(id: string) {
    const staff = await this.findOne(id);
    staff.isActive = false;
    return await this.userRepository.save(staff);
  }
}
