import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LabourPayment } from './entities/labour-payment.entity.js';
import { DailyWorker } from '../daily-labour/entities/daily-worker.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateLabourPaymentDto } from './dto/create-labour-payment.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export type UnpaidLabourWeekSummary = {
  userId: string;
  userName: string;
  weekStart: string;
  weekEnd: string;
  totalAmount: number;
  entryCount: number;
};

// Monday of the week containing `date`, matching Postgres's
// date_trunc('week', ...) (ISO week, Monday start). reportDate is a
// date-only column so this stays in UTC to avoid off-by-one shifts.
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

// A worker's day rate: prefer the rate captured on the entry itself
// (auto-filled from the trade's rate at entry time, editable per line);
// fall back to the trade's currently configured shiftWiseAmount for older
// entries saved before that field existed. Same rule used across this app
// wherever labour cost is computed (DailyLabourDetailClient, project cost).
function resolveRate(worker: DailyWorker): number {
  return Number(worker.shiftAmount ?? worker.tradeRel?.shiftWiseAmount ?? 0);
}

function entryAmount(worker: DailyWorker): number {
  return (
    (Number(worker.count) || 1) *
    (Number(worker.shift) || 0) *
    resolveRate(worker)
  );
}

@Injectable()
export class LabourPaymentsService {
  constructor(
    @InjectRepository(LabourPayment)
    private readonly repo: Repository<LabourPayment>,
    @InjectRepository(DailyWorker)
    private readonly workerRepo: Repository<DailyWorker>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  // One row per (site engineer, week) that still has admin-approved trade
  // entries not yet attached to a payment — this is what "Record a Payment"
  // picks from.
  async getUnpaidWeeklySummary(): Promise<UnpaidLabourWeekSummary[]> {
    const workers = await this.workerRepo
      .createQueryBuilder('w')
      .innerJoinAndSelect('w.report', 'r')
      .leftJoinAndSelect('w.tradeRel', 'trade')
      .innerJoin('r.createdBy', 'u')
      .addSelect(['u.id', 'u.name'])
      .where('w.status = :status', { status: 'approved' })
      .andWhere('w.labourPaymentId IS NULL')
      .andWhere('r.isDeleted = false')
      .getMany();

    const groups = new Map<string, UnpaidLabourWeekSummary>();
    for (const w of workers) {
      const report = w.report;
      const weekStartDate = mondayOf(new Date(report.reportDate));
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
      const weekStart = toDateStr(weekStartDate);
      const weekEnd = toDateStr(weekEndDate);
      const key = `${report.createdById}|${weekStart}`;

      const existing = groups.get(key);
      const amount = entryAmount(w);
      if (existing) {
        existing.totalAmount += amount;
        existing.entryCount += 1;
      } else {
        groups.set(key, {
          userId: report.createdById,
          userName: report.createdBy?.name || '',
          weekStart,
          weekEnd,
          totalAmount: amount,
          entryCount: 1,
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) =>
        b.weekStart.localeCompare(a.weekStart) ||
        a.userName.localeCompare(b.userName),
    );
  }

  async create(dto: CreateLabourPaymentDto, actorUserId: string) {
    const workers = await this.workerRepo
      .createQueryBuilder('w')
      .innerJoinAndSelect('w.report', 'r')
      .leftJoinAndSelect('w.tradeRel', 'trade')
      .where('r.createdById = :userId', { userId: dto.userId })
      .andWhere('w.status = :status', { status: 'approved' })
      .andWhere('w.labourPaymentId IS NULL')
      .andWhere('r.isDeleted = false')
      .andWhere('r.reportDate BETWEEN :weekStart AND :weekEnd', {
        weekStart: dto.weekStart,
        weekEnd: dto.weekEnd,
      })
      .getMany();

    if (workers.length === 0) {
      throw new BadRequestException(
        'No admin-approved, unpaid trade entries found for this site engineer in the selected week',
      );
    }

    const user = await this.usersRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    // The payment always covers the exact sum of the trade entries it
    // attaches — computed here rather than trusted from the client — so
    // the amount can never drift from what's actually being marked paid.
    const amount = workers.reduce((sum, w) => sum + entryAmount(w), 0);

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

    await this.workerRepo.update(
      { id: In(workers.map((w) => w.id)) },
      { labourPaymentId: saved.id },
    );

    const weekLabel = `${dto.weekStart} to ${dto.weekEnd}`;
    await this.notifications.createForUser(dto.userId, {
      userId: actorUserId,
      type: 'labour_payment_recorded',
      title:
        saved.status === 'paid'
          ? 'Labour Payment Made'
          : 'Labour Payment Recorded',
      message: `${workers.length} trade ${workers.length > 1 ? 'entries' : 'entry'} totaling ${amount} for the week of ${weekLabel} ${saved.status === 'paid' ? 'were paid' : 'were recorded for payment'}.`,
      link: '/dashboard/new',
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
        type: 'labour_payment_paid',
        title: 'Labour Payment Made',
        message: `Your labour payment of ${payment.amount} for the week of ${payment.weekStart.toString().split('T')[0]} to ${payment.weekEnd.toString().split('T')[0]} was paid.`,
        link: '/dashboard/new',
        entityId: payment.id,
      });
    }

    return saved;
  }
}
