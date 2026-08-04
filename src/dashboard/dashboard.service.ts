import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Project } from '../projects/entities/project.entity.js';
import { ProjectMilestone } from '../projects/entities/project-milestone.entity.js';
import { AttendanceLog } from '../projects/entities/attendance-log.entity.js';
import { SalesInvoice } from '../accounts/entities/sales-invoice.entity.js';
import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { User } from '../users/entities/user.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { PurchaseEnquiry } from '../purchase-enquiries/entities/purchase-enquiry.entity.js';
import { MaterialReceived } from '../material-received/entities/material-received.entity.js';
import { WeeklyTimesheet } from '../timesheet-attendance/entities/weekly-timesheet.entity.js';
import { InvoiceStatus, PurchaseOrderStatus } from '../common/enums.js';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMilestone)
    private milestonesRepo: Repository<ProjectMilestone>,
    @InjectRepository(AttendanceLog)
    private attendanceRepo: Repository<AttendanceLog>,
    @InjectRepository(SalesInvoice)
    private invoiceRepo: Repository<SalesInvoice>,
    @InjectRepository(PurchaseBill) private billRepo: Repository<PurchaseBill>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseEnquiry)
    private enquiryRepo: Repository<PurchaseEnquiry>,
    @InjectRepository(MaterialReceived)
    private materialReceivedRepo: Repository<MaterialReceived>,
    @InjectRepository(WeeklyTimesheet)
    private tsRepo: Repository<WeeklyTimesheet>,
  ) {}

  async getPurchaseAssignedProjects(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['projects'],
    });
    if (!user) throw new NotFoundException('User not found');
    return (user.projects || []).map((p) => ({
      id: p.id,
      name: p.name,
      projectCode: p.projectCode,
      status: p.status,
      completionPct: Number(p.completionPct),
      location: p.location,
      clientName: p.clientName,
    }));
  }

  async getPurchaseDashboard(userId: string) {
    // 0. Projects assigned to this purchase team member
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['projects'],
    });
    const assignedProjectCount = user?.projects?.length || 0;

    // 1. Pending POs (Approved but not fully billed)
    const pendingPOs = await this.poRepo.find({
      where: {
        status: PurchaseOrderStatus.APPROVED,
        isDeleted: false,
      },
      relations: ['vendor', 'items', 'project'],
      order: { createdAt: 'DESC' },
    });

    // 2. Unpaid bill count (no amounts — that's Accounts' concern)
    const bills = await this.billRepo.find({
      where: { isDeleted: false },
      relations: ['vendor'],
    });

    const unpaidBillCount = bills.filter(
      (b) => Number(b.amount) - Number(b.paidAmount || 0) > 0,
    ).length;

    // 3. Material Requirements raised by Site Engineers, awaiting purchase action
    const materialRequirementCount = await this.enquiryRepo.count({
      where: { isDeleted: false },
    });

    // 4. Material Received records logged so far
    const materialReceivedCount = await this.materialReceivedRepo.count({
      where: { isDeleted: false },
    });

    // 5. Recent Activity (Latest POs and Bills — no amounts)
    const recentPOs = await this.poRepo.find({
      where: { isDeleted: false },
      relations: ['vendor'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentBills = await this.billRepo.find({
      where: { isDeleted: false },
      relations: ['vendor'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      pendingPOs: pendingPOs.map((po) => {
        const totalQty =
          po.items?.reduce((s, i) => s + Number(i.quantity), 0) || 0;
        const totalBilled =
          po.items?.reduce((s, i) => s + Number(i.billedQuantity || 0), 0) || 0;
        return {
          id: po.id,
          poNumber: po.poNumber,
          vendorName: po.vendor?.name,
          projectName: po.project?.name,
          fulfillment:
            totalQty > 0 ? Math.round((totalBilled / totalQty) * 100) : 0,
          createdAt: po.createdAt,
        };
      }),
      kpis: {
        assignedProjectCount,
        materialRequirementCount,
        materialReceivedCount,
        activePOCount: pendingPOs.length,
        unpaidBillCount,
      },
      recentActivity: {
        pos: recentPOs.map((po) => ({
          id: po.id,
          poNumber: po.poNumber,
          vendorName: po.vendor?.name,
          status: po.status,
          createdAt: po.createdAt,
        })),
        bills: recentBills.map((bill) => ({
          id: bill.id,
          billNumber: bill.billNumber,
          vendorName: bill.vendor?.name,
          status: bill.status,
          billDate: bill.billDate,
        })),
      },
    };
  }

  async getAccountsDashboard() {
    // 1. Receivables Summary (Unpaid or partial invoices)
    const invoices = await this.invoiceRepo.find({
      where: { isDeleted: false },
      relations: ['project'],
    });

    const totalReceivable = invoices.reduce((sum, inv) => {
      if (
        inv.status === InvoiceStatus.PAID ||
        inv.status === InvoiceStatus.CANCELLED
      )
        return sum;
      const balance =
        Number(inv.totalAmount) +
        Number(inv.gstAmount) -
        Number(inv.paidAmount || 0);
      return sum + balance;
    }, 0);

    const pendingInvoiceCount = invoices.filter(
      (inv) =>
        inv.status !== InvoiceStatus.PAID &&
        inv.status !== InvoiceStatus.CANCELLED,
    ).length;

    // 2. Payables Summary (Outstanding bills)
    const bills = await this.billRepo.find({
      where: { isDeleted: false },
      relations: ['vendor'],
    });

    const totalPayable = bills.reduce((sum, bill) => {
      const balance = Number(bill.amount) - Number(bill.paidAmount || 0);
      return sum + balance;
    }, 0);

    const pendingBillCount = bills.filter(
      (b) => Number(b.amount) - Number(b.paidAmount || 0) > 0,
    ).length;

    // 3. Recent Payments (Latest 10)
    const recentPayments = await this.paymentRepo.find({
      where: { isDeleted: false },
      relations: ['vendor', 'project'],
      order: { paymentDate: 'DESC' },
      take: 10,
    });

    // 4. Inflow vs Outflow (Current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthInflow = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total')
      .where(
        'p.isDeleted = false AND p.paymentType = :type AND p.paymentDate >= :start',
        {
          type: 'revenue',
          start: startOfMonth,
        },
      )
      .getRawOne();

    const monthOutflow = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total')
      .where(
        'p.isDeleted = false AND p.paymentType != :type AND p.paymentDate >= :start',
        {
          type: 'revenue',
          start: startOfMonth,
        },
      )
      .getRawOne();

    return {
      kpis: {
        totalReceivable,
        pendingInvoiceCount,
        totalPayable,
        pendingBillCount,
        monthInflow: Number(monthInflow?.total || 0),
        monthOutflow: Number(monthOutflow?.total || 0),
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        date: p.paymentDate,
        mode: p.paymentMode,
        type: p.paymentType,
        party: p.vendor?.name || p.project?.clientName || p.payeeName,
      })),
    };
  }

  async getMasterDashboard() {
    const projects = await this.projectsRepo.find({
      where: { isDeleted: false },
    });
    const totalProjects = projects.length;

    // Revenue vs Cost
    const revenueResult = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.totalAmount + inv.gstAmount)', 'total')
      .where('inv.isDeleted = false AND inv.status = :status', {
        status: InvoiceStatus.PAID,
      })
      .getRawOne();

    const paymentCost = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoin('p.expense', 'expense')
      .select('SUM(p.amount)', 'total')
      .where('p.isDeleted = false')
      .andWhere("p.paymentType != 'revenue'")
      .andWhere('(expense.status = :status OR expense.status IS NULL)', {
        status: 'approved',
      })
      .getRawOne();

    const revenuePayment = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total')
      .where('p.isDeleted = false')
      .andWhere("p.paymentType = 'revenue'")
      .getRawOne();

    const totalRevenue = Number(revenueResult?.total || 0);
    const totalCost = Number(paymentCost?.total || 0);
    const totalInflow = Number(revenuePayment?.total || 0);

    // Weekly labour (last 8 weeks)
    const weeklyLabour = await this.attendanceRepo
      .createQueryBuilder('a')
      .select("DATE_TRUNC('week', a.logDate)", 'weekStart')
      .addSelect('SUM(a.headcount)', 'headcount')
      .groupBy("DATE_TRUNC('week', a.logDate)")
      .orderBy("DATE_TRUNC('week', a.logDate)", 'DESC')
      .limit(8)
      .getRawMany();

    return {
      totalProjects,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        completionPct: Number(p.completionPct),
      })),
      revenueVsCost: { totalRevenue, totalCost, totalInflow },
      weeklyLabour: weeklyLabour.map((w) => ({
        weekStart: w.weekStart,
        headcount: Number(w.headcount),
      })),
      criticalActions: [],
    };
  }

  async getEngineerDashboard(userId: string) {
    const engineer = await this.usersRepo.findOne({
      where: { id: userId, isActive: true },
      relations: ['projects'],
    });

    if (!engineer) {
      throw new NotFoundException('Engineer not found');
    }

    const assignedProjects = engineer.projects || [];

    // Material Requirements
    const materialRequirements = await this.enquiryRepo.find({
      where: { createdBy: userId, isDeleted: false },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
    const mrTotal = materialRequirements.length;
    const mrPending = materialRequirements.filter((m) => m.status === 'pending').length;
    const mrApproved = materialRequirements.filter((m) => m.status === 'approved').length;
    const mrRejected = materialRequirements.filter((m) => m.status === 'rejected').length;
    const recentMRs = materialRequirements.slice(0, 5).map((m) => ({
      id: m.id,
      enquiryNo: m.enquiryNo,
      projectName: m.project?.name || '-',
      status: m.status,
      createdAt: m.createdAt,
    }));

    // Timesheet statuses for current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTimesheets = await this.tsRepo.find({
      where: {
        siteEngineerId: userId,
        isDeleted: false,
        weekStart: MoreThanOrEqual(startOfMonth),
      },
    });
    const tsApproved = monthTimesheets.filter((t) => t.status === 'approved').length;
    const tsSubmitted = monthTimesheets.filter((t) => t.status === 'submitted').length;
    const tsDraft = monthTimesheets.filter((t) => t.status === 'draft' || t.status === 'pending').length;

    return {
      totalProjects: assignedProjects.length,
      projects: assignedProjects.map((p) => ({
        id: p.id,
        name: p.name,
        completionPct: Number(p.completionPct),
      })),
      revenueVsCost: { totalRevenue: 0, totalCost: 0 },
      weeklyLabour: [],
      criticalActions: [],
      materialRequirementCounts: { total: mrTotal, pending: mrPending, approved: mrApproved, rejected: mrRejected },
      recentMaterialRequirements: recentMRs,
      timesheetCounts: { approved: tsApproved, submitted: tsSubmitted, draft: tsDraft, total: monthTimesheets.length },
    };
  }

  async getEngineerReport(user: any) {
    const engineer = await this.usersRepo.findOne({
      where: { id: user.id, isActive: true },
      relations: ['projects', 'salaryGrade'],
    });
    if (!engineer) throw new NotFoundException('Engineer not found');

    const hourlyRate = engineer.salaryGrade?.avgCostPerHr ?? 0;

    const assignedProjects = (engineer.projects || []).map((p) => ({
      id: p.id,
      name: p.name,
      completionPct: Number(p.completionPct),
    }));

    const mrs = await this.enquiryRepo.find({
      where: { createdBy: user.id, isDeleted: false },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });

    const timesheets = await this.tsRepo.find({
      where: { siteEngineerId: user.id, isDeleted: false },
      order: { weekStart: 'DESC' },
    });

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceLogs = await this.attendanceRepo.find({
      where: { logDate: MoreThanOrEqual(thirtyDaysAgo) as any },
      relations: ['project'],
      order: { logDate: 'DESC' },
    });

    return {
      engineer: { id: engineer.id, name: engineer.name, email: engineer.email, employeeId: engineer.employeeId, phone: engineer.phone },
      assignedProjects,
      materialRequirements: mrs.map((m) => ({
        id: m.id,
        enquiryNo: m.enquiryNo,
        projectName: m.project?.name || '-',
        status: m.status,
        items: m.items,
        notes: m.notes,
        createdAt: m.createdAt,
      })),
      hourlyRate,
      timesheets: timesheets.map((t) => ({
        id: t.id,
        weekStart: t.weekStart,
        weekEnd: t.weekEnd,
        totalHours: Number(t.totalHours),
        earnedAmount: Number((Number(t.totalHours) * hourlyRate).toFixed(2)),
        status: t.status,
      })),
      attendanceLogs: attendanceLogs.map((a) => ({
        date: a.logDate,
        projectName: a.project?.name || '-',
        headcount: a.headcount,
      })),
    };
  }
}
