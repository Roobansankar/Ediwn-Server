import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ProjectProgress } from './entities/project-progress.entity.js';
import { ProjectMilestone } from './entities/project-milestone.entity.js';
import { ChangeOrder } from './entities/change-order.entity.js';
import { AttendanceLog } from './entities/attendance-log.entity.js';
import { MachineryLog } from './entities/machinery-log.entity.js';
import { SnagItem } from './entities/snag-item.entity.js';
import { SafetyIncident } from './entities/safety-incident.entity.js';
import { Rfi } from './entities/rfi.entity.js';
import { SitePhoto } from './entities/site-photo.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { SubcontractWorkOrder } from '../subcontract-work-orders/entities/subcontract-work-order.entity.js';
import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { SalesInvoice } from '../accounts/entities/sales-invoice.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import {
  SubcontractWorkOrderStatus,
  BillStatus,
  ExpenseStatus,
} from '../common/enums.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
    @InjectRepository(ProjectProgress)
    private progressRepo: Repository<ProjectProgress>,
    @InjectRepository(ProjectMilestone)
    private milestonesRepo: Repository<ProjectMilestone>,
    @InjectRepository(ChangeOrder)
    private changeOrdersRepo: Repository<ChangeOrder>,
    @InjectRepository(AttendanceLog)
    private attendanceRepo: Repository<AttendanceLog>,
    @InjectRepository(MachineryLog)
    private machineryRepo: Repository<MachineryLog>,
    @InjectRepository(SnagItem) private snagsRepo: Repository<SnagItem>,
    @InjectRepository(SafetyIncident)
    private incidentsRepo: Repository<SafetyIncident>,
    @InjectRepository(Rfi) private rfisRepo: Repository<Rfi>,
    @InjectRepository(SitePhoto) private photosRepo: Repository<SitePhoto>,
    @InjectRepository(Expense) private expensesRepo: Repository<Expense>,
    @InjectRepository(SubcontractWorkOrder)
    private swoRepo: Repository<SubcontractWorkOrder>,
    @InjectRepository(PurchaseBill) private billsRepo: Repository<PurchaseBill>,
    @InjectRepository(SalesInvoice)
    private invoicesRepo: Repository<SalesInvoice>,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateProjectDto, userId?: string): Promise<Project> {
    const existingCode = await this.projectsRepo.findOne({
      where: { projectCode: dto.projectCode },
    });
    if (existingCode)
      throw new ConflictException('Project code already in use');

    const { resourceIds, ...rest } = dto;
    const project = this.projectsRepo.create({ ...rest, createdBy: userId });
    if (resourceIds && resourceIds.length > 0) {
      project.resources = await this.usersRepo.findBy({ id: In(resourceIds) });
    }
    return this.projectsRepo.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepo.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    userId?: string,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (dto.projectCode && dto.projectCode !== project.projectCode) {
      const existingCode = await this.projectsRepo.findOne({
        where: { projectCode: dto.projectCode },
      });
      if (existingCode)
        throw new ConflictException('Project code already in use');
    }

    const { resourceIds, ...rest } = dto;
    if (resourceIds !== undefined) {
      project.resources =
        resourceIds.length > 0
          ? await this.usersRepo.findBy({ id: In(resourceIds) })
          : [];
    }

    Object.assign(project, { ...rest, updatedBy: userId });
    return this.projectsRepo.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    project.isDeleted = true;
    await this.projectsRepo.save(project);
  }

  async getDashboard(id: string) {
    const project = await this.findOne(id);

    const [
      progress,
      milestones,
      changeOrders,
      attendance,
      machinery,
      snags,
      incidents,
      rfis,
      photos,
    ] = await Promise.all([
      this.progressRepo.find({
        where: { projectId: id },
        order: { weekStartDate: 'DESC' },
      }),
      this.milestonesRepo.find({
        where: { projectId: id },
        order: { plannedDate: 'ASC' },
      }),
      this.changeOrdersRepo.find({
        where: { projectId: id },
        order: { date: 'DESC' },
      }),
      this.attendanceRepo.find({
        where: { projectId: id },
        order: { logDate: 'DESC' },
        take: 30,
      }),
      this.machineryRepo.find({
        where: { projectId: id },
        order: { logDate: 'DESC' },
        take: 30,
      }),
      this.snagsRepo.find({
        where: { projectId: id },
        order: { createdAt: 'DESC' },
      }),
      this.incidentsRepo.find({
        where: { projectId: id },
        order: { incidentDate: 'DESC' },
      }),
      this.rfisRepo.find({
        where: { projectId: id },
        order: { raisedDate: 'DESC' },
      }),
      this.photosRepo.find({
        where: { projectId: id },
        order: { weekDate: 'DESC' },
        take: 20,
      }),
    ]);

    return {
      project,
      progress,
      milestones,
      changeOrders,
      attendance,
      machinery,
      snags,
      incidents,
      rfis,
      photos,
    };
  }

  async getProjectDetails(id: string) {
    const project = await this.findOne(id);

    const [expenses, subcontractWorkOrders, purchaseBills, invoices, payments] =
      await Promise.all([
        this.expensesRepo.find({
          where: {
            projectId: id,
            isDeleted: false,
            status: ExpenseStatus.ADMIN_APPROVED,
          },
          relations: ['project', 'trade', 'expenseType', 'creator'],
          order: { expenseDate: 'DESC' },
        }),
        this.swoRepo.find({
          where: {
            projectId: id,
            isDeleted: false,
            status: SubcontractWorkOrderStatus.ADMIN_APPROVED,
          },
          relations: ['project', 'subcontractor', 'workCategory'],
          order: { createdAt: 'DESC' },
        }),
        this.billsRepo.find({
          where: {
            projectId: id,
            isDeleted: false,
            status: BillStatus.ADMIN_APPROVED,
          },
          relations: ['vendor', 'project'],
          order: { createdAt: 'DESC' },
        }),
        this.invoicesRepo.find({
          where: { projectId: id, isDeleted: false },
          relations: ['project', 'items', 'payments'],
          order: { createdAt: 'DESC' },
        }),
        this.paymentsRepo.find({
          where: { projectId: id, isDeleted: false },
          relations: [
            'project',
            'vendor',
            'purchaseBill',
            'purchaseOrder',
            'subcontractWorkOrder',
            'expense',
            'salesInvoice',
          ],
          order: { paymentDate: 'DESC' },
        }),
      ]);

    return {
      project,
      expenses,
      subcontractWorkOrders,
      purchaseBills,
      invoices,
      payments,
    };
  }

  // Sub-resource creation methods
  async addProgress(projectId: string, data: Partial<ProjectProgress>) {
    await this.findOne(projectId);
    const entry = this.progressRepo.create({ ...data, projectId });
    return this.progressRepo.save(entry);
  }

  async addMilestone(projectId: string, data: Partial<ProjectMilestone>) {
    await this.findOne(projectId);
    const entry = this.milestonesRepo.create({ ...data, projectId });
    return this.milestonesRepo.save(entry);
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    data: Partial<ProjectMilestone>,
  ) {
    await this.findOne(projectId);
    await this.milestonesRepo.update(milestoneId, data);
    return this.milestonesRepo.findOne({ where: { id: milestoneId } });
  }

  async addAttendance(projectId: string, data: Partial<AttendanceLog>) {
    await this.findOne(projectId);
    const entry = this.attendanceRepo.create({ ...data, projectId });
    return this.attendanceRepo.save(entry);
  }

  async addSnag(projectId: string, data: Partial<SnagItem>) {
    await this.findOne(projectId);
    const entry = this.snagsRepo.create({ ...data, projectId });
    return this.snagsRepo.save(entry);
  }

  async updateSnag(projectId: string, snagId: string, data: Partial<SnagItem>) {
    await this.findOne(projectId);
    await this.snagsRepo.update(snagId, data);
    return this.snagsRepo.findOne({ where: { id: snagId } });
  }

  async addRfi(projectId: string, data: Partial<Rfi>) {
    await this.findOne(projectId);
    const entry = this.rfisRepo.create({ ...data, projectId });
    return this.rfisRepo.save(entry);
  }

  async updateRfi(projectId: string, rfiId: string, data: Partial<Rfi>) {
    await this.findOne(projectId);
    await this.rfisRepo.update(rfiId, data);
    return this.rfisRepo.findOne({ where: { id: rfiId } });
  }

  async addIncident(projectId: string, data: Partial<SafetyIncident>) {
    await this.findOne(projectId);
    const entry = this.incidentsRepo.create({ ...data, projectId });
    return this.incidentsRepo.save(entry);
  }

  async addMachinery(projectId: string, data: Partial<MachineryLog>) {
    await this.findOne(projectId);
    const entry = this.machineryRepo.create({ ...data, projectId });
    return this.machineryRepo.save(entry);
  }

  async addChangeOrder(projectId: string, data: Partial<ChangeOrder>) {
    await this.findOne(projectId);
    const entry = this.changeOrdersRepo.create({ ...data, projectId });
    return this.changeOrdersRepo.save(entry);
  }
}
