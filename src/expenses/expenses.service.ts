import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Expense } from './entities/expense.entity.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import {
  ExpenseCategory,
  PaymentType,
  PaymentMode,
  Role,
} from '../common/enums.js';
import { Payment } from '../payments/entities/payment.entity.js';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private expensesRepo: Repository<Expense>,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    private dataSource: DataSource,
  ) {}

  async create(
    dto: CreateExpenseDto,
    userId?: string,
    files?: Express.Multer.File[],
  ): Promise<Expense> {
    return await this.dataSource.transaction(async (manager) => {
      // Handle file uploads
      const receiptUrls: string[] = [];
      const receiptKeys: string[] = [];
      const sitePhotoUrls: string[] = [];
      const sitePhotoKeys: string[] = [];

      if (files && files.length > 0) {
        files.forEach((file) => {
          if (file.fieldname === 'sitePhotos') {
            sitePhotoUrls.push(`/uploads/expenses/${file.filename}`);
            sitePhotoKeys.push(file.filename);
          } else {
            // Default to receipts if fieldname is 'files' or anything else
            receiptUrls.push(`/uploads/expenses/${file.filename}`);
            receiptKeys.push(file.filename);
          }
        });
      }

      // 1. Create the Expense
      const expense = manager.create(Expense, {
        ...dto,
        createdBy: userId,
        receiptUrls: receiptUrls.length > 0 ? receiptUrls : undefined,
        receiptKeys: receiptKeys.length > 0 ? receiptKeys : undefined,
        sitePhotoUrls: sitePhotoUrls.length > 0 ? sitePhotoUrls : undefined,
        sitePhotoKeys: sitePhotoKeys.length > 0 ? sitePhotoKeys : undefined,
        // For backward compatibility, set the first one as primary
        receiptUrl: receiptUrls.length > 0 ? receiptUrls[0] : undefined,
        receiptKey: receiptKeys.length > 0 ? receiptKeys[0] : undefined,
      });
      const savedExpense = await manager.save(expense);

      // 2. Create Payment record only if expense is approved
      if (dto.status === 'approved') {
        let pType = PaymentType.STAFF_EXPENSE;
        if (dto.category === ExpenseCategory.OFFICE)
          pType = PaymentType.OFFICE_MAINTENANCE;
        if (dto.category === ExpenseCategory.TRANSPORT)
          pType = PaymentType.TRANSPORT;
        if (dto.category === ExpenseCategory.TRAVEL) pType = PaymentType.TRAVEL;

        const payment = manager.create(Payment, {
          paymentType: pType,
          expenseId: savedExpense.id,
          amount: dto.amount,
          paymentDate: dto.expenseDate,
          paymentMode: PaymentMode.CASH,
          payeeName: dto.paidBy || 'Staff',
          projectId: dto.projectId,
          notes: dto.description + (dto.remarks ? ` - ${dto.remarks}` : ''),
          createdBy: userId,
        });
        await manager.save(payment);
      }

      return savedExpense;
    });
  }

  async findAll(
    query: {
      category?: ExpenseCategory;
      projectId?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
      mine?: boolean;
    },
    user?: any,
  ) {
    const {
      category,
      projectId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      mine,
    } = query;
    const qb = this.expensesRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.project', 'project')
      .leftJoinAndSelect('e.trade', 'trade')
      .leftJoinAndSelect('e.creator', 'creator')
      .leftJoinAndSelect('e.expenseType', 'expenseType')
      .where('e.isDeleted = false');
    if (category) qb.andWhere('e.category = :category', { category });
    if (projectId) qb.andWhere('e.projectId = :projectId', { projectId });
    if (dateFrom && dateTo)
      qb.andWhere('e.expenseDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });

    // Site engineers and office staff only ever see their own individual
    // expenses. Admin/accounts see everyone's by default (the Expenses
    // oversight page relies on that) — but the personal "My Expense" page
    // explicitly asks for `mine=true` to narrow the same endpoint down to
    // just the current user's own entries, same as everyone else gets.
    if (
      user &&
      (mine || user.role === Role.SITE_ENGINEER || user.role === Role.OFFICE_STAFF)
    ) {
      qb.andWhere('e.createdBy = :userId', { userId: user.id });
    }

    qb.orderBy('e.expenseDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expensesRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['project', 'trade', 'creator', 'expenseType'],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async update(
    id: string,
    dto: Partial<CreateExpenseDto>,
    user?: { role: string },
    files?: Express.Multer.File[],
  ): Promise<Expense> {
    if (dto.status !== undefined && user) {
      if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTS_MANAGER) {
        throw new ForbiddenException(
          'Only admin and accounts can update expense status',
        );
      }
      if (user.role === Role.ACCOUNTS_MANAGER && dto.status === 'admin_approved') {
        throw new ForbiddenException(
          'Only admin can give final approval',
        );
      }
    }

    const expense = await this.findOne(id);

    // Handle new file uploads
    if (files && files.length > 0) {
      const receiptUrls = expense.receiptUrls || [];
      const receiptKeys = expense.receiptKeys || [];
      const sitePhotoUrls = expense.sitePhotoUrls || [];
      const sitePhotoKeys = expense.sitePhotoKeys || [];

      files.forEach((file) => {
        if (file.fieldname === 'sitePhotos') {
          sitePhotoUrls.push(`/uploads/expenses/${file.filename}`);
          sitePhotoKeys.push(file.filename);
        } else {
          receiptUrls.push(`/uploads/expenses/${file.filename}`);
          receiptKeys.push(file.filename);
        }
      });

      expense.receiptUrls =
        receiptUrls.length > 0 ? receiptUrls : expense.receiptUrls;
      expense.receiptKeys =
        receiptKeys.length > 0 ? receiptKeys : expense.receiptKeys;
      expense.sitePhotoUrls =
        sitePhotoUrls.length > 0 ? sitePhotoUrls : expense.sitePhotoUrls;
      expense.sitePhotoKeys =
        sitePhotoKeys.length > 0 ? sitePhotoKeys : expense.sitePhotoKeys;

      // Update primary if it was empty
      if (!expense.receiptUrl && receiptUrls.length > 0) {
        expense.receiptUrl = receiptUrls[0];
        expense.receiptKey = receiptKeys[0];
      }
    }

    // If status changed to approved, ensure a payment record exists and is active
    if (dto.status === 'approved' && expense.status !== 'approved') {
      const existing = await this.paymentsRepo.findOne({
        where: { expenseId: id },
      });
      if (existing) {
        if (existing.isDeleted) {
          await this.paymentsRepo.update(
            { expenseId: id },
            { isDeleted: false },
          );
        }
      } else {
        let pType = PaymentType.STAFF_EXPENSE;
        if (expense.category === ExpenseCategory.OFFICE)
          pType = PaymentType.OFFICE_MAINTENANCE;
        if (expense.category === ExpenseCategory.TRANSPORT)
          pType = PaymentType.TRANSPORT;
        if (expense.category === ExpenseCategory.TRAVEL)
          pType = PaymentType.TRAVEL;

        const payment = this.paymentsRepo.create({
          paymentType: pType,
          expenseId: id,
          amount: expense.amount,
          paymentDate: expense.expenseDate,
          paymentMode: PaymentMode.CASH,
          payeeName: expense.paidBy || 'Staff',
          projectId: expense.projectId,
          notes:
            expense.description +
            (expense.remarks ? ` - ${expense.remarks}` : ''),
          createdBy: expense.createdBy,
        });
        await this.paymentsRepo.save(payment);
      }
    }

    // If status changed away from approved, soft-delete the payment
    if (
      dto.status &&
      dto.status !== 'approved' &&
      expense.status === 'approved'
    ) {
      await this.paymentsRepo.update({ expenseId: id }, { isDeleted: true });
    }

    Object.assign(expense, dto);
    return this.expensesRepo.save(expense);
  }

  async softDelete(id: string): Promise<void> {
    const expense = await this.findOne(id);
    expense.isDeleted = true;
    await this.expensesRepo.save(expense);

    // Also soft-delete the associated payment in the Master Ledger
    await this.paymentsRepo.update({ expenseId: id }, { isDeleted: true });
  }

  async getSummary() {
    const result = await this.expensesRepo
      .createQueryBuilder('e')
      .select('e.category', 'category')
      .addSelect('SUM(e.amount)', 'total')
      .where('e.isDeleted = false')
      .andWhere('e.status = :status', { status: 'approved' })
      .groupBy('e.category')
      .getRawMany();
    return result;
  }
}
