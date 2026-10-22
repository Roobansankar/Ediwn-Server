import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ErpContextDto } from './erp-context.dto.js';

type Dataset = {
  domain: string;
  table: string;
  date: string;
  status: string;
  fields: string[];
  metrics: Record<string, string>;
  search: string[];
  party?: 'vendor' | 'subcontractor';
};
const invoiceTotal = '(r.totalAmount + r.gstAmount)';
const poTotal = 'COALESCE(NULLIF(r.totalWithGst, 0), r.totalAmount, 0)';
const poPaid =
  '(SELECT COALESCE(SUM(pp.amount), 0) FROM payments pp WHERE pp."purchaseOrderId" = r.id AND pp."isDeleted" = false)';
const datasets: Dataset[] = [
  {
    domain: 'projects',
    table: 'projects',
    date: 'createdAt',
    status: 'status',
    fields: [
      'name',
      'projectCode',
      'status',
      'location',
      'clientName',
      'completionPct',
      'estimatedBudget',
      'estimatedGst',
      'estimatedTotal',
      'startDate',
      'endDate',
    ],
    metrics: {
      budgetExcludingGst: 'r.estimatedBudget',
      budgetIncludingGst: 'r.estimatedTotal',
    },
    search: ['r.name', 'r.projectCode', 'r.clientName', 'r.location'],
  },
  {
    domain: 'expenses',
    table: 'expenses',
    date: 'expenseDate',
    status: 'status',
    fields: ['description', 'category', 'amount', 'status', 'expenseDate'],
    metrics: { recordedExpenseAmount: 'r.amount' },
    search: ['r.description'],
  },
  {
    domain: 'cashflow',
    table: 'payments',
    date: 'paymentDate',
    status: 'paymentType',
    fields: [
      'paymentType',
      'amount',
      'paymentDate',
      'paymentMode',
      'referenceNumber',
      'payeeName',
    ],
    metrics: {
      inflow: "CASE WHEN r.paymentType = 'revenue' THEN r.amount ELSE 0 END",
      outflow: "CASE WHEN r.paymentType <> 'revenue' THEN r.amount ELSE 0 END",
      netCashflow:
        "CASE WHEN r.paymentType = 'revenue' THEN r.amount ELSE -r.amount END",
    },
    search: ['r.payeeName', 'r.referenceNumber'],
    party: 'vendor',
  },
  {
    domain: 'purchases',
    table: 'purchase_orders',
    date: 'createdAt',
    status: 'status',
    fields: [
      'poNumber',
      'status',
      'totalAmount',
      'gstAmount',
      'totalWithGst',
      'expectedDate',
    ],
    metrics: {
      orderedIncludingGst: poTotal,
      paidAgainstOrdersAllTime: poPaid,
      outstandingAgainstOrdersAllTime: `GREATEST(${poTotal} - ${poPaid}, 0)`,
    },
    search: ['r.poNumber'],
    party: 'vendor',
  },
  {
    domain: 'purchases',
    table: 'material_requirements',
    date: 'createdAt',
    status: 'status',
    fields: ['enquiryNo', 'status', 'expectedDate'],
    metrics: {},
    search: ['r.enquiryNo', 'r.purposeOfMaterial'],
    party: 'vendor',
  },
  {
    domain: 'purchases',
    table: 'material_received',
    date: 'receivedDate',
    status: 'status',
    fields: ['mrNumber', 'status', 'receivedDate', 'purchaseOrderId'],
    metrics: {},
    search: ['r.mrNumber'],
  },
  {
    domain: 'accounts',
    table: 'sales_invoices',
    date: 'createdAt',
    status: 'status',
    fields: [
      'invoiceNumber',
      'status',
      'totalAmount',
      'gstAmount',
      'paidAmount',
      'dueDate',
    ],
    metrics: {
      invoicedIncludingGst: invoiceTotal,
      receivable: `CASE WHEN r.status NOT IN ('paid', 'cancelled') THEN GREATEST(${invoiceTotal} - r.paidAmount, 0) ELSE 0 END`,
    },
    search: ['r.invoiceNumber'],
  },
  {
    domain: 'accounts',
    table: 'purchase_bills',
    date: 'billDate',
    status: 'status',
    fields: [
      'billNumber',
      'status',
      'amount',
      'paidAmount',
      'billDate',
      'dueDate',
    ],
    metrics: { billedAmount: 'r.amount', recordedPaidAmount: 'r.paidAmount' },
    search: ['r.billNumber'],
    party: 'vendor',
  },
  {
    domain: 'subcontracts',
    table: 'subcontract_work_orders',
    date: 'createdAt',
    status: 'status',
    fields: [
      'woNumber',
      'status',
      'description',
      'totalAmount',
      'startDate',
      'endDate',
    ],
    metrics: { orderedIncludingGst: 'r.totalAmount' },
    search: ['r.woNumber', 'r.description'],
    party: 'subcontractor',
  },
  {
    domain: 'subcontracts',
    table: 'subcontractor_bills',
    date: 'billDate',
    status: 'status',
    fields: [
      'billNumber',
      'status',
      'amount',
      'paidAmount',
      'billDate',
      'dueDate',
    ],
    metrics: { billedAmount: 'r.amount', recordedPaidAmount: 'r.paidAmount' },
    search: ['r.billNumber'],
    party: 'subcontractor',
  },
];

@Injectable()
export class ErpContextService {
  constructor(private readonly database: DataSource) {}

  async catalog() {
    const query = this.database
      .createQueryBuilder()
      .from('projects', 'p')
      .where('p.isDeleted = false');
    const total = await query.clone().getCount();
    const projects = await query
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.projectCode AS "projectCode"',
      ])
      .orderBy('p.name', 'ASC')
      .limit(500)
      .getRawMany();
    return { projects, total, truncated: total > projects.length };
  }

  async context(input: ErpContextDto) {
    if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo)
      throw new BadRequestException('Start date must not be after end date');
    if (
      [input.dateFrom, input.dateTo].some(
        (date) => date && !/^\d{4}-\d{2}-\d{2}$/.test(date),
      )
    )
      throw new BadRequestException('Use YYYY-MM-DD dates');
    return this.database.transaction('REPEATABLE READ', async (manager) => {
      await manager.query('SET TRANSACTION READ ONLY');
      await manager.query("SET LOCAL statement_timeout = '8000ms'");
      const reports = [];
      for (const dataset of datasets.filter((item) =>
        input.purchaseOrderView
          ? item.table === 'purchase_orders'
          : input.domains.includes(item.domain) ||
            (input.domains.includes('accounts') &&
              item.table === 'purchase_orders'),
      )) {
        reports.push(await this.report(manager, dataset, input));
      }
      return {
        retrievedAt: new Date().toISOString(),
        currency: 'INR',
        filters: input,
        reports,
        definitions: [
          'Aggregates cover ALL matching non-deleted records. Recent rows and per-project groups are limited; never treat them as complete lists.',
          'Cashflow uses payments ledger only: revenue is inflow; all other payment types are outflow. Linked expenses must be approved and not deleted, matching the Payments page. Cashflow is not profit or bank balance.',
          'Expense amounts are recorded claims, separated by approval status, not automatically cash outflow. Do not add expenses or bills to ledger payments as this double counts.',
          'Purchase order outstanding = max(order inclusive total minus all-time non-deleted payments linked directly to that PO, 0), matching Accounts payables. Dates filter orders by creation, not payment date. Status groups include pending/rejected orders unless explicitly filtered.',
          'Invoice receivables exclude paid/cancelled invoices and include GST less recorded paidAmount. Purchase/subcontract bills are billed amounts, not a separate authoritative payable total. Do not add PO and bill totals together.',
          'Date filters use the dateField shown in each report. Invoice/order/project dates are creation dates. No date filters means all time. Missing dates do not match a date range.',
          'Only listed datasets and fields are connected. Items, attachments, bank credentials, personnel details, and other modules are not included. Do not claim access to them.',
        ],
      };
    });
  }

  private async report(
    manager: EntityManager,
    config: Dataset,
    input: ErpContextDto,
  ) {
    const isProject = config.table === 'projects';
    const query = manager
      .createQueryBuilder()
      .from(config.table, 'r')
      .where('r.isDeleted = false');
    if (!isProject) query.leftJoin('r.project', 'project');
    if (config.party) query.leftJoin(`r.${config.party}`, 'party');
    if (config.table === 'payments') {
      query
        .leftJoin('r.expense', 'expense')
        .andWhere('(expense.isDeleted = false OR expense.isDeleted IS NULL)')
        .andWhere(
          '(expense.status = :approvedExpense OR expense.status IS NULL)',
          { approvedExpense: 'approved' },
        );
    }
    if (input.projectId)
      query.andWhere(`${isProject ? 'r.id' : 'r.projectId'} = :projectId`, {
        projectId: input.projectId,
      });
    if (input.dateFrom)
      query.andWhere(`CAST(r.${config.date} AS date) >= :dateFrom`, {
        dateFrom: input.dateFrom,
      });
    if (input.dateTo)
      query.andWhere(`CAST(r.${config.date} AS date) <= :dateTo`, {
        dateTo: input.dateTo,
      });
    if (input.status)
      query.andWhere(`CAST(r.${config.status} AS text) = :status`, {
        status: input.status,
      });
    if (
      config.table === 'purchase_orders' &&
      input.purchaseOrderView === 'pending'
    ) {
      query.andWhere('r.status = :pendingOrderStatus', {
        pendingOrderStatus: 'pending',
      });
    }
    if (
      config.table === 'purchase_orders' &&
      input.purchaseOrderView === 'outstanding'
    ) {
      query.andWhere(`${poTotal} - ${poPaid} > 0`);
    }
    if (input.search?.trim()) {
      const fields = [
        ...config.search,
        ...(config.party ? ['party.name'] : []),
      ];
      query.andWhere(
        `(${fields.map((field) => `CAST(${field} AS text) ILIKE :search`).join(' OR ')})`,
        { search: `%${input.search.trim().replace(/[\\%_]/g, '\\$&')}%` },
      );
    }
    const aggregateSelect = () => [
      'COUNT(*)::int AS count',
      ...Object.entries(config.metrics).map(
        ([name, expression]) =>
          `COALESCE(SUM(${expression}), 0)::text AS "${name}"`,
      ),
    ];
    const totals = (await query
      .clone()
      .select(aggregateSelect())
      .getRawOne<{ count: number } & Record<string, string | number>>()) ?? {
      count: 0,
    };
    const byStatus = await query
      .clone()
      .select([
        `CAST(r.${config.status} AS text) AS status`,
        ...aggregateSelect(),
      ])
      .groupBy(`r.${config.status}`)
      .orderBy(`r.${config.status}`, 'ASC')
      .getRawMany();
    const byProject = isProject
      ? []
      : await query
          .clone()
          .select(['project.name AS "projectName"', ...aggregateSelect()])
          .groupBy('project.id')
          .addGroupBy('project.name')
          .orderBy('COUNT(*)', 'DESC')
          .limit(20)
          .getRawMany();
    const rows = await query
      .clone()
      .select([
        'r.id AS id',
        ...config.fields.map((field) => `r.${field} AS "${field}"`),
        ...(config.table === 'purchase_orders'
          ? Object.entries(config.metrics).map(
              ([name, expression]) => `${expression} AS "${name}"`,
            )
          : []),
        ...(isProject ? [] : ['project.name AS "projectName"']),
        ...(config.party ? ['party.name AS "partyName"'] : []),
      ])
      .orderBy(`r.${config.date}`, 'DESC', 'NULLS LAST')
      .addOrderBy('r.id', 'ASC')
      .limit(12)
      .getRawMany();
    return {
      source: config.table,
      dateField: config.date,
      totals,
      byStatus,
      byProject,
      projectGroupsLimitedTo: 20,
      recentRecords: rows,
      recentRecordsTruncated: totals.count > rows.length,
    };
  }
}
