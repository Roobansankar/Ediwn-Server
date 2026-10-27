import { randomUUID } from 'node:crypto';
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
  projectNames: string[];
  teamNames: string[];
  workerIds: string[];
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

// Accounts approval is an intermediate stage; only final admin approval is payable.
const PAYABLE_TRADE_STATUSES = ['admin_approved'];

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

  // One row per (site engineer, week, labour team) that still has admin-approved trade
  // entries not yet attached to a payment — this is what "Record a Payment"
  // picks from.
  async getUnpaidWeeklySummary(): Promise<UnpaidLabourWeekSummary[]> {
    const workers = await this.workerRepo
      .createQueryBuilder('w')
      .innerJoinAndSelect('w.report', 'r')
      .leftJoinAndSelect('w.tradeRel', 'trade')
      .leftJoinAndSelect('trade.team', 'team')
      .leftJoinAndSelect('r.project', 'project')
      .innerJoin('r.createdBy', 'u')
      .addSelect(['u.id', 'u.name'])
      .where('w.status IN (:...statuses)', { statuses: PAYABLE_TRADE_STATUSES })
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
      const key = JSON.stringify([
        report.createdById,
        weekStart,
        w.tradeRel?.teamId || w.tradeRel?.team?.name || null,
      ]);

      const existing = groups.get(key);
      const amount = entryAmount(w);
      const projectName = report.project?.name;
      const teamName = w.tradeRel?.team?.name;
      if (existing) {
        existing.totalAmount += amount;
        existing.entryCount += 1;
        existing.workerIds.push(w.id);
        if (projectName && !existing.projectNames.includes(projectName))
          existing.projectNames.push(projectName);
        if (teamName && !existing.teamNames.includes(teamName))
          existing.teamNames.push(teamName);
      } else {
        groups.set(key, {
          userId: report.createdById,
          userName: report.createdBy?.name || '',
          weekStart,
          weekEnd,
          totalAmount: amount,
          entryCount: 1,
          projectNames: projectName ? [projectName] : [],
          teamNames: teamName ? [teamName] : [],
          workerIds: [w.id],
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
      // Serialize payments for the engineer, including concurrent first payments.
      const user = await manager.findOne(User, {
        where: { id: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');
      let payment: LabourPayment;
      let workerIds: string[] = [];
      if (dto.paymentId) {
        const existing = await manager.findOne(LabourPayment, {
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
            'Payment does not belong to the selected engineer and week',
          );
        }
        payment = existing;
      } else {
        const workerQuery = manager
          .getRepository(DailyWorker)
          .createQueryBuilder('w')
          .innerJoinAndSelect('w.report', 'r')
          .leftJoinAndSelect('w.tradeRel', 'trade')
          .where('r.createdById = :userId', { userId: dto.userId })
          .andWhere('w.status IN (:...statuses)', {
            statuses: PAYABLE_TRADE_STATUSES,
          })
          .andWhere('w.labourPaymentId IS NULL')
          .andWhere('r.isDeleted = false')
          .andWhere('r.reportDate BETWEEN :weekStart AND :weekEnd', {
            weekStart: dto.weekStart,
            weekEnd: dto.weekEnd,
          });
        if (dto.workerIds) {
          workerQuery.andWhere('w.id IN (:...workerIds)', {
            workerIds: dto.workerIds,
          });
        }
        const workers = await workerQuery.getMany();
        if (dto.workerIds && workers.length !== new Set(dto.workerIds).size) {
          throw new BadRequestException(
            'Selected labour entries have changed. Refresh and try again',
          );
        }
        if (!workers.length)
          throw new BadRequestException(
            'No admin-approved, unpaid trade entries found for this site engineer in the selected week',
          );
        workerIds = workers.map((worker) => worker.id);
        payment = manager.create(LabourPayment, {
          userId: dto.userId,
          userName: user.name,
          weekStart: new Date(dto.weekStart),
          weekEnd: new Date(dto.weekEnd),
          amount:
            Math.round(
              workers.reduce((sum, worker) => sum + entryAmount(worker), 0) *
                100,
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
      const result = await manager.save(LabourPayment, payment);
      if (workerIds.length)
        await manager.update(
          DailyWorker,
          { id: In(workerIds) },
          { labourPaymentId: result.id },
        );
      return result;
    });
    await this.notifications.createForUser(dto.userId, {
      userId: actorUserId,
      type: 'labour_payment_recorded',
      title: 'Labour Payment Recorded',
      message: `Labour payment recorded for ${dto.weekStart} to ${dto.weekEnd}.`,
      link: '/dashboard/new',
      entityId: saved.id,
    });
    return saved;
  }

  async findAll() {
    const payments = await this.repo.find({
      where: { isDeleted: false },
      order: { weekStart: 'DESC', createdAt: 'DESC' },
    });
    if (!payments.length) return [];
    const workers = await this.workerRepo.find({
      where: { labourPaymentId: In(payments.map((payment) => payment.id)) },
      relations: { tradeRel: { team: true }, report: { project: true } },
    });
    return payments.map((payment) => {
      const entries = workers.filter(
        (worker) => worker.labourPaymentId === payment.id,
      );
      return {
        ...payment,
        teamNames: [
          ...new Set(
            entries.map(
              (worker) => worker.tradeRel?.team?.name || 'Unassigned Team',
            ),
          ),
        ],
        projectNames: [
          ...new Set(
            entries
              .map((worker) => worker.report?.project?.name)
              .filter((name): name is string => !!name),
          ),
        ],
      };
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
