import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
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

  private async generateEmployeeId(
    role: Role = Role.OFFICE_STAFF,
  ): Promise<string> {
    const prefixByRole: Record<string, string> = {
      [Role.OFFICE_STAFF]: 'EMP',
      [Role.SITE_ENGINEER]: 'EMP-SE',
      [Role.ACCOUNTS_MANAGER]: 'EMP-ACC',
      [Role.PURCHASE_TEAM]: 'EMP-PUR',
    };
    const prefix = prefixByRole[role] ?? 'EMP';
    const staffList = await this.userRepository.find({
      where: { role },
      select: ['employeeId'],
    });
    let maxSeq = 100;
    const pattern = new RegExp(`^${prefix}-(\\d+)$`);
    for (const s of staffList) {
      const match = s.employeeId?.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
    return `${prefix}-${maxSeq + 1}`;
  }

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

    const role = dto.role || Role.OFFICE_STAFF;
    const staff = this.userRepository.create({
      name: dto.name,
      email:
        dto.email ||
        (dto.username && dto.username.includes('@')
          ? dto.username
          : `${dto.username || 'staff'}_${Date.now()}@temp.com`),
      username: dto.username,
      employeeId: dto.employeeId || (await this.generateEmployeeId(role)),
      phone: dto.phone,
      address: dto.address,
      staffType: role === Role.OFFICE_STAFF ? dto.staffType : undefined,
      role,
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
      where: {
        role: In([
          Role.OFFICE_STAFF,
          Role.ACCOUNTS_MANAGER,
          Role.PURCHASE_TEAM,
        ]),
      },
      relations: ['projects', 'salaryGrade'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const staff = await this.userRepository.findOne({
      where: {
        id,
        role: In([
          Role.OFFICE_STAFF,
          Role.ACCOUNTS_MANAGER,
          Role.PURCHASE_TEAM,
        ]),
      },
      relations: ['projects', 'salaryGrade'],
    });
    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }
    return staff;
  }

  async update(id: string, dto: UpdateOfficeStaffDto) {
    const staff = await this.findOne(id);

    if (dto.email && dto.email !== staff.email) {
      const existingEmail = await this.userRepository.findOne({
        where: [
          { email: dto.email, id: Not(staff.id) },
          { username: dto.email, id: Not(staff.id) },
        ],
      });
      if (existingEmail) throw new ConflictException('Email already in use');
    }
    if (dto.username && dto.username !== staff.username) {
      const existingUsername = await this.userRepository.findOne({
        where: [
          { username: dto.username, id: Not(staff.id) },
          { email: dto.username, id: Not(staff.id) },
        ],
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

    const nextRole = dto.role !== undefined ? dto.role : staff.role;
    Object.assign(staff, {
      name: dto.name !== undefined ? dto.name : staff.name,
      email: dto.email !== undefined ? dto.email : staff.email,
      username: dto.username !== undefined ? dto.username : staff.username,
      employeeId:
        dto.employeeId !== undefined ? dto.employeeId : staff.employeeId,
      phone: dto.phone !== undefined ? dto.phone : staff.phone,
      address: dto.address !== undefined ? dto.address : staff.address,
      role: nextRole,
      staffType:
        nextRole === Role.OFFICE_STAFF
          ? dto.staffType !== undefined
            ? dto.staffType
            : staff.staffType
          : undefined,
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
