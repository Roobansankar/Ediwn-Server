import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProjectAccess, ProjectAccessStatus } from './entities/project-access.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { Role } from '../common/enums.js';

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(ProjectAccess)
    private readonly accessRepo: Repository<ProjectAccess>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async findStaff(projectId?: string) {
    const staff = await this.userRepo.find({
      where: {
        isActive: true,
        role: In([Role.OFFICE_STAFF, Role.ACCOUNTS_MANAGER]),
      },
      relations: ['projects', 'salaryGrade'],
      order: { name: 'ASC' },
    });

    if (!projectId) {
      return staff;
    }

    const accesses = await this.accessRepo.find({
      where: { projectId, isDeleted: false },
    });
    const accessMap = new Map(accesses.map((a) => [a.userId, a]));

    return staff.map((s) => {
      const access = accessMap.get(s.id);
      return {
        ...s,
        access: access
          ? {
              id: access.id,
              approvedDays: access.approvedDays,
              approvedAt: access.approvedAt,
              expiresAt: access.expiresAt,
              status: access.status,
            }
          : null,
      };
    });
  }

  async approve(
    projectId: string,
    userId: string,
    days: number,
    approvedById: string,
  ): Promise<ProjectAccess> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId, isDeleted: false },
    });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['projects'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (
      user.role !== Role.OFFICE_STAFF &&
      user.role !== Role.ACCOUNTS_MANAGER
    ) {
      throw new BadRequestException(
        'Access can only be approved for office staff or accounts managers',
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + days);

    let access = await this.accessRepo.findOne({
      where: { projectId, userId, isDeleted: false },
    });

    if (access) {
      access.approvedDays = days;
      access.approvedAt = now;
      access.expiresAt = expiresAt;
      access.status = ProjectAccessStatus.ACTIVE;
      access.approvedById = approvedById;
    } else {
      access = this.accessRepo.create({
        projectId,
        userId,
        approvedDays: days,
        approvedAt: now,
        expiresAt,
        status: ProjectAccessStatus.ACTIVE,
        approvedById,
      });
    }
    await this.accessRepo.save(access);

    const alreadyAssigned = (user.projects || []).some((p) => p.id === projectId);
    if (!alreadyAssigned) {
      const projectRef = await this.projectRepo.findOne({ where: { id: projectId } });
      user.projects = [...(user.projects || []), projectRef!];
      await this.userRepo.save(user);
    }

    return access;
  }

  async revoke(projectId: string, userId: string): Promise<void> {
    const access = await this.accessRepo.findOne({
      where: { projectId, userId, isDeleted: false },
    });
    if (!access) throw new NotFoundException('No active access record found');

    access.status = ProjectAccessStatus.REVOKED;
    access.isDeleted = true;
    await this.accessRepo.save(access);

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['projects'],
    });
    if (user) {
      user.projects = (user.projects || []).filter((p) => p.id !== projectId);
      await this.userRepo.save(user);
    }
  }

  async markExpired(): Promise<void> {
    const now = new Date();
    const expired = await this.accessRepo
      .createQueryBuilder('access')
      .where('access.status = :status', { status: ProjectAccessStatus.ACTIVE })
      .andWhere('access.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('access.expiresAt <= :now', { now })
      .getMany();
    for (const access of expired) {
      access.status = ProjectAccessStatus.EXPIRED;
    }
    if (expired.length > 0) await this.accessRepo.save(expired);
  }

  async findAll() {
    return this.accessRepo.find({
      where: { isDeleted: false },
      relations: ['project', 'user'],
      order: { createdAt: 'DESC' },
    });
  }
}
