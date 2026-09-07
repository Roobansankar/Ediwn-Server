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
      .addSelect(`date_trunc('week', e.expenseDate)`, 'weekStart')
      .addSelect(
        `date_trunc('week', e.expenseDate) + interval '6 days'`,
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
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      totalAmount: Number(r.totalAmount),
      expenseCount: Number(r.expenseCount),
    }));
  }

  async create(dto: CreateExpensePaymentDto, actorUserId: string) {
    const expenses = await this.expenseRepo
      .createQueryBuilder('e')
      .where('e.createdBy = :userId', { userId: dto.userId })
      .andWhere('e.status = :status', { status: ExpenseStatus.ADMIN_APPROVED })
      .andWhere('e.isDeleted = false')
      .andWhere('e.expensePaymentId IS NULL')
      .andWhere('e.expenseDate BETWEEN :weekStart AND :weekEnd', {
        weekStart: dto.weekStart,
        weekEnd: dto.weekEnd,
      })
      .getMany();

    if (expenses.length === 0) {
      throw new BadRequestException(
        'No admin-approved, unpaid expenses found for this user in the selected week',
      );
    }

    const user = await this.usersRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    // The payment always covers the exact sum of the expenses it attaches —
    // computed here rather than trusted from the client — so the amount can
    // never drift from what's actually being marked paid.
    const amount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const payment = this.repo.create({
      userId: dto.userId,
      userName: user.name,
      weekStart: new Date(dto.weekStart),
      weekEnd: new Date(dto.weekEnd),
      amount,
      paymentDate: new Date(dto.paymentDate),
      status: dto.status || 'pending',
      notes: dto.notes || null,
      createdById: actorUserId,
    });
    const saved = await this.repo.save(payment);

    await this.expenseRepo.update(
      { id: In(expenses.map((e) => e.id)) },
      { expensePaymentId: saved.id },
    );

    const weekLabel = `${dto.weekStart} to ${dto.weekEnd}`;
    await this.notifications.createForUser(dto.userId, {
      userId: actorUserId,
      type: 'expense_payment_recorded',
      title:
        saved.status === 'paid'
          ? 'Expense Payment Made'
          : 'Expense Payment Recorded',
      message: `${expenses.length} expense${expenses.length > 1 ? 's' : ''} totaling ${amount} for the week of ${weekLabel} ${saved.status === 'paid' ? 'were paid' : 'were recorded for payment'}.`,
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
