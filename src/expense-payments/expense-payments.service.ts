import { randomUUID } from 'node:crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExpensePayment } from './entities/expense-payment.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateExpensePaymentDto } from './dto/create-expense-payment.dto.js';
import { ExpenseStatus } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export type UnpaidWeekSummary = {
  userId: string;
  userName: string;
  weekStart: string;
  weekEnd: string;
  totalAmount: number;
  expenseCount: number;
};

function mondayOf(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class ExpensePaymentsService {
  constructor(
    @InjectRepository(ExpensePayment)
    private readonly repo: Repository<ExpensePayment>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  // One row per (user, week) that still has admin-approved expenses not yet
  // attached to a payment — this is what "Record a Payment" picks from.
  async getUnpaidWeeklySummary(): Promise<UnpaidWeekSummary[]> {
    type RawRow = {
      userId: string;
      userName: string;
      weekStart: string;
      weekEnd: string;
      totalAmount: string;
      expenseCount: string;
    };

    const rows = await this.expenseRepo
      .createQueryBuilder('e')
      .innerJoin('e.creator', 'u')
      .select('e.createdBy', 'userId')
      .addSelect('u.name', 'userName')
      .addSelect(
        `to_char(date_trunc('week', e.expenseDate), 'YYYY-MM-DD')`,
        'weekStart',
      )
      .addSelect(
        `to_char(date_trunc('week', e.expenseDate) + interval '6 days', 'YYYY-MM-DD')`,
        'weekEnd',
      )
      .addSelect('SUM(e.amount)', 'totalAmount')
      .addSelect('COUNT(*)', 'expenseCount')
      .where('e.status = :status', { status: ExpenseStatus.ADMIN_APPROVED })
      .andWhere('e.isDeleted = false')
      .andWhere('e.expensePaymentId IS NULL')
      .groupBy('e.createdBy')
      .addGroupBy('u.name')
      .addGroupBy(`date_trunc('week', e.expenseDate)`)
      .orderBy(`date_trunc('week', e.expenseDate)`, 'DESC')
      .addOrderBy('u.name', 'ASC')
      .getRawMany<RawRow>();

    return rows.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      // Keep database calendar dates intact; converting local midnight to UTC
      // can move Monday back to Sunday and make payment validation fail.
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      totalAmount: Number(r.totalAmount),
      expenseCount: Number(r.expenseCount),
    }));
  }

  async create(dto: CreateExpensePaymentDto, actorUserId: string) {
    const weekStart = mondayOf(new Date(dto.weekStart));
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    if (
      toDateStr(weekStart) !== dto.weekStart ||
      toDateStr(weekEnd) !== dto.weekEnd
    ) {
      throw new BadRequestException('Select a Monday-to-Sunday week');
    }
    const saved = await this.repo.manager.transaction(async (manager) => {
      // Serialize payments for the user, including concurrent first payments.
      const user = await manager.findOne(User, {
        where: { id: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');
      let payment: ExpensePayment;
      let expenseIds: string[] = [];
      if (dto.paymentId) {
        const existing = await manager.findOne(ExpensePayment, {
          where: { id: dto.paymentId, isDeleted: false },
          lock: { mode: 'pessimistic_write' },
        });
        if (!existing) throw new NotFoundException('Payment not found');
        if (
          existing.userId !== dto.userId ||
          (existing.weekStart instanceof Date
            ? toDateStr(existing.weekStart)
            : String(existing.weekStart).slice(0, 10)) !== dto.weekStart ||
          (existing.weekEnd instanceof Date
            ? toDateStr(existing.weekEnd)
            : String(existing.weekEnd).slice(0, 10)) !== dto.weekEnd
        ) {
          throw new BadRequestException(
            'Payment does not belong to the selected user and week',
          );
        }
        payment = existing;
      } else {
        const expenseQuery = manager
          .getRepository(Expense)
          .createQueryBuilder('w')

          .where('w.createdBy = :userId', { userId: dto.userId })
          .andWhere('w.status IN (:...statuses)', {
            statuses: [ExpenseStatus.ADMIN_APPROVED],
          })
          .andWhere('w.expensePaymentId IS NULL')
          .andWhere('w.isDeleted = false')
          .andWhere('w.expenseDate BETWEEN :weekStart AND :weekEnd', {
            weekStart: dto.weekStart,
            weekEnd: dto.weekEnd,
          });
        const expenses = await expenseQuery.getMany();
        if (!expenses.length)
          throw new BadRequestException(
            'No admin-approved, unpaid expenses found for this user in the selected week',
          );
        expenseIds = expenses.map((expense) => expense.id);
        payment = manager.create(ExpensePayment, {
          userId: dto.userId,
          userName: user.name,
          weekStart: new Date(dto.weekStart),
          weekEnd: new Date(dto.weekEnd),
          amount:
            Math.round(
              expenses.reduce(
                (sum, expense) => sum + Number(expense.amount),
                0,
              ) * 100,
            ) / 100,
          paymentDate: new Date(dto.paymentDate),
          status: 'pending',
          paymentHistory: [],
          notes: dto.notes || null,
          createdById: actorUserId,
        });
      }
      const history = payment.paymentHistory || [];
      const paid = history.length
        ? history.reduce((sum, entry) => sum + Number(entry.amount), 0)
        : payment.status === 'paid'
          ? Number(payment.amount)
          : 0;
      const balance = Math.round((Number(payment.amount) - paid) * 100) / 100;
      const amount = dto.amount ?? balance;
      if (!Number.isFinite(amount) || amount <= 0 || amount > balance)
        throw new BadRequestException(
          'Payment amount must be positive and cannot exceed the remaining balance',
        );
      // Legacy pending creation remains supported; recording money is append-only.
      if (dto.status !== 'pending') {
        payment.paymentHistory = [
          ...history,
          {
            id: randomUUID(),
            amount,
            paymentDate: dto.paymentDate,
            paymentMode: dto.paymentMode || 'cash',
            referenceNumber: dto.referenceNumber?.trim() || null,
            notes: dto.notes?.trim() || null,
            createdById: actorUserId,
          },
        ];
        payment.status =
          Math.round((paid + amount) * 100) >=
          Math.round(Number(payment.amount) * 100)
            ? 'paid'
            : 'partial';
        payment.paymentDate = new Date(dto.paymentDate);
      }
      const result = await manager.save(ExpensePayment, payment);
      if (expenseIds.length)
        await manager.update(
          Expense,
          { id: In(expenseIds) },
          { expensePaymentId: result.id },
        );
      return result;
    });
    await this.notifications.createForUser(dto.userId, {
      userId: actorUserId,
      type: 'expense_payment_recorded',
      title: 'Expense Payment Recorded',
      message: `Expense payment recorded for ${dto.weekStart} to ${dto.weekEnd}.`,
      link: '/dashboard/expenses',
      entityId: saved.id,
    });
    return saved;
  }

  async findAll() {
    return this.repo.find({
      where: { isDeleted: false },
      order: { weekStart: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string) {
    const payment = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if ((payment.paymentHistory || []).length) {
      throw new BadRequestException(
        'Record the remaining amount as a payment instead of changing its status',
      );
    }
    payment.status = status;
    const saved = await this.repo.save(payment);

    if (status === 'paid') {
      await this.notifications.createForUser(payment.userId, {
        type: 'expense_payment_paid',
        title: 'Expense Payment Made',
        message: `Your expense payment of ${payment.amount} for the week of ${payment.weekStart.toString().split('T')[0]} to ${payment.weekEnd.toString().split('T')[0]} was paid.`,
        link: '/dashboard/expenses',
        entityId: payment.id,
      });
    }

    return saved;
  }
}
