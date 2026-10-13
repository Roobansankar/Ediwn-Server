import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, In, Brackets } from 'typeorm';
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
import { SubcontractWorkOrder } from '../subcontract-work-orders/entities/subcontract-work-order.entity.js';
import { SubcontractorBill } from '../subcontractor-bills/entities/subcontractor-bill.entity.js';
import { LabourPaymentsService } from '../labour-payments/labour-payments.service.js';
import { ExpensePaymentsService } from '../expense-payments/expense-payments.service.js';
import {
  BillStatus,
  InvoiceStatus,
  PurchaseOrderStatus,
} from '../common/enums.js';

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

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
    @InjectRepository(SubcontractWorkOrder)
    private swoRepo: Repository<SubcontractWorkOrder>,
    @InjectRepository(SubcontractorBill)
    private subBillRepo: Repository<SubcontractorBill>,
    private labourPayments: LabourPaymentsService,
    private expensePayments: ExpensePaymentsService,
  ) {}

  // Shared by both the purchase-team and site-engineer "assigned projects"
  // endpoints — the shape doesn't depend on role, only on the user's
  // `projects` relation (many-to-many assignment).
  async getAssignedProjectsForUser(userId: string) {
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

  async getPurchaseAssignedProjects(userId: string) {
    return this.getAssignedProjectsForUser(userId);
  }

  async getPurchaseDashboard(userId: string) {
    // 0. Projects assigned to this purchase team member
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['projects'],
    });
    const assignedProjectCount = user?.projects?.length || 0;

    // 1. Active POs (Approved but not fully billed)
    const pendingPOs = await this.poRepo.find({
      where: {
        status: PurchaseOrderStatus.APPROVED,
        isDeleted: false,
      },
      relations: ['vendor', 'items', 'project'],
      order: { createdAt: 'DESC' },
    });

    // 1b. Genuinely pending POs (submitted, awaiting approval) — distinct
    // from the "active" (approved) ones above.
    const pendingPOCount = await this.poRepo.count({
      where: {
        status: PurchaseOrderStatus.PENDING,
        isDeleted: false,
      },
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
        pendingPOCount,
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

    // 2. Material payables — driven off approved (accounts approved or
    // approved) purchase bills that are not deleted, less what has been paid.
    // Bills raised against the same PO are owed together and offset by every
    // payment made against that PO or its bills; a bill with no PO uses its
    // own payments. Pending, rejected and deleted bills owe nothing yet.
    const approvedBills = await this.billRepo.find({
      where: { isDeleted: false, status: In(['admin_approved', 'approved']) },
    });
    const billIds = approvedBills.map((b) => b.id);
    const poIds = [...new Set(approvedBills.map((b) => b.purchaseOrderId).filter(Boolean))];
    const billPayments = billIds.length || poIds.length
      ? await this.paymentRepo
          .createQueryBuilder('p')
          .select(['p.id', 'p.amount', 'p.purchaseOrderId', 'p.purchaseBillId'])
          .where('p.isDeleted = false')
          .andWhere(
            new Brackets((qb) => {
              if (poIds.length) qb.orWhere('p.purchaseOrderId IN (:...poIds)', { poIds });
              if (billIds.length) qb.orWhere('p.purchaseBillId IN (:...billIds)', { billIds });
            }),
          )
          .getMany()
      : [];
    const billById = new Map(approvedBills.map((b) => [b.id, b]));
    // Group key: the PO when there is one, otherwise the bill itself.
    const groupOf = (poId?: string | null, billId?: string | null) =>
      poId ? `po:${poId}` : billId ? `bill:${billId}` : null;
    const owedByGroup = new Map<string, number>();
    for (const b of approvedBills) {
      const key = groupOf(b.purchaseOrderId, b.id)!;
      owedByGroup.set(key, (owedByGroup.get(key) || 0) + Number(b.amount || 0));
    }
    const paidByGroup = new Map<string, number>();
    for (const p of billPayments) {
      const poId = p.purchaseOrderId || (p.purchaseBillId ? billById.get(p.purchaseBillId)?.purchaseOrderId : null);
      const key = groupOf(poId, p.purchaseBillId);
      if (!key || !owedByGroup.has(key)) continue;
      paidByGroup.set(key, (paidByGroup.get(key) || 0) + Number(p.amount || 0));
    }
    const billBalances = [...owedByGroup.entries()].map(([key, owed]) => owed - (paidByGroup.get(key) || 0));

    const totalPayable = billBalances.reduce(
      (sum, balance) => sum + Math.max(balance, 0),
      0,
    );
    const pendingBillCount = billBalances.filter((balance) => balance > 0).length;

    // 2b. The same payables figure split by what the money is owed for.
    // Material is the PO figure above, unchanged. Sub Contractor mirrors it
    // for subcontract work orders (order total less payments made against
    // it; rejected orders are never owed). Labour and Expenses follow the
    // weekly payment pages: whatever is approved but not yet attached to a
    // payment, plus payments recorded there that are still 'pending'. An
    // entry leaves the unpaid list the moment it's attached to a payment,
    // so nothing is counted twice.
    // Sub Contractor: only bills Admin has approved (final approval), less
    // what has been paid. Grouped by work order like Material groups by PO,
    // so payments made against the WO (payment requests) count too.
    const approvedSubBills = await this.subBillRepo.find({
      where: { isDeleted: false, status: BillStatus.APPROVED },
    });
    const subGroupOf = (woId?: string | null, billId?: string | null) =>
      woId ? `wo:${woId}` : billId ? `bill:${billId}` : null;
    const subOwedByGroup = new Map<string, number>();
    for (const b of approvedSubBills) {
      const key = subGroupOf(b.subcontractWorkOrderId, b.id)!;
      subOwedByGroup.set(key, (subOwedByGroup.get(key) || 0) + Number(b.amount || 0));
    }
    const subBillById = new Map(approvedSubBills.map((b) => [b.id, b]));
    const subWoIds = [...new Set(approvedSubBills.map((b) => b.subcontractWorkOrderId).filter(Boolean))];
    const subBillIds = approvedSubBills.map((b) => b.id);
    const subPayments = subWoIds.length || subBillIds.length
      ? await this.paymentRepo
          .createQueryBuilder('p')
          .select(['p.id', 'p.amount', 'p.subcontractWorkOrderId', 'p.subcontractorBillId'])
          .where('p.isDeleted = false')
          .andWhere(
            new Brackets((qb) => {
              if (subWoIds.length) qb.orWhere('p.subcontractWorkOrderId IN (:...subWoIds)', { subWoIds });
              if (subBillIds.length) qb.orWhere('p.subcontractorBillId IN (:...subBillIds)', { subBillIds });
            }),
          )
          .getMany()
      : [];
    const subPaidByGroup = new Map<string, number>();
    for (const p of subPayments) {
      const woId = p.subcontractWorkOrderId
        || (p.subcontractorBillId ? subBillById.get(p.subcontractorBillId)?.subcontractWorkOrderId : null);
      const key = subGroupOf(woId, p.subcontractorBillId);
      if (!key || !subOwedByGroup.has(key)) continue;
      subPaidByGroup.set(key, (subPaidByGroup.get(key) || 0) + Number(p.amount || 0));
    }
    const swoBalances = [...subOwedByGroup.entries()]
      .map(([key, owed]) => owed - (subPaidByGroup.get(key) || 0))
      .filter((balance) => balance > 0);

    const [
      unpaidLabourWeeks,
      recordedLabourPayments,
      unpaidExpenseWeeks,
      recordedExpensePayments,
    ] = await Promise.all([
      this.labourPayments.getUnpaidWeeklySummary(),
      this.labourPayments.findAll(),
      this.expensePayments.getUnpaidWeeklySummary(),
      this.expensePayments.findAll(),
    ]);
    const weeklyPayable = (
      unpaidWeeks: { totalAmount: number }[],
      recorded: { status: string; amount: number }[],
    ) => {
      const pending = recorded.filter((p) => p.status === 'pending');
      return {
        amount: roundMoney(
          unpaidWeeks.reduce((sum, w) => sum + Number(w.totalAmount), 0) +
            pending.reduce((sum, p) => sum + Number(p.amount), 0),
        ),
        count: unpaidWeeks.length + pending.length,
      };
    };

    const payableByCategory = {
      labour: weeklyPayable(unpaidLabourWeeks, recordedLabourPayments),
      material: { amount: totalPayable, count: pendingBillCount },
      subcontractor: {
        amount: roundMoney(swoBalances.reduce((sum, b) => sum + b, 0)),
        count: swoBalances.length,
      },
      expenses: weeklyPayable(unpaidExpenseWeeks, recordedExpensePayments),
    };

    // 3. Inflow vs Outflow (Current month)
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
        payableByCategory,
        monthInflow: Number(monthInflow?.total || 0),
        monthOutflow: Number(monthOutflow?.total || 0),
      },
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

    // Timesheet statuses for current month. A weekly timesheet counts as "this
    // month" if its week overlaps the current month at all (weekStart is
    // often in the previous month when the month doesn't start on a Monday),
    // not just when the week's Monday itself falls on/after the 1st.
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthTimesheets = await this.tsRepo.find({
      where: {
        siteEngineerId: userId,
        isDeleted: false,
        weekEnd: MoreThanOrEqual(startOfMonth),
        weekStart: LessThanOrEqual(endOfMonth),
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
