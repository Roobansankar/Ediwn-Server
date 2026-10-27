/* eslint-disable @typescript-eslint/require-await -- Repository mocks resolve immediately. */
import { BadRequestException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { LabourPaymentsService } from './labour-payments.service.js';
import { LabourPayment } from './entities/labour-payment.entity.js';
import { DailyWorker } from '../daily-labour/entities/daily-worker.entity.js';
import { User } from '../users/entities/user.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';

describe('Labour payment approval eligibility', () => {
  function setup(statuses: string[]) {
    let allowed: string[] = [];
    let selectedIds: string[] | undefined;
    const workers = statuses.map((status, index) => ({
      id: `worker-${index}`,
      status,
      count: 1,
      shift: 1,
      shiftAmount: 100,
      tradeRel: { team: { name: 'Masonry Team' } },
      report: {
        reportDate: '2026-10-12',
        createdById: 'engineer',
        createdBy: { name: 'Engineer' },
        project: { name: 'Highway' },
      },
    }));
    const query = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockImplementation(filter),
      andWhere: jest.fn().mockImplementation(filter),
      getMany: jest.fn(async () =>
        workers.filter(
          (worker) =>
            allowed.includes(worker.status) &&
            (!selectedIds || selectedIds.includes(worker.id)),
        ),
      ),
    };
    function filter(
      _sql: string,
      params?: { statuses?: string[]; workerIds?: string[] },
    ) {
      if (params?.statuses) allowed = params.statuses;
      if (params?.workerIds) selectedIds = params.workerIds;
      return query;
    }
    const manager = {
      findOne: jest.fn(async (entity: unknown) =>
        entity === User ? { id: 'engineer', name: 'Engineer' } : null,
      ),
      getRepository: jest.fn(() => ({ createQueryBuilder: () => query })),
      create: jest.fn((_entity: unknown, data: unknown) => data),
      save: jest.fn(async (_entity: unknown, data: unknown) => ({
        id: 'payment',
        ...(data as object),
      })),
      update: jest.fn(),
    };
    const repo = {
      create: jest.fn(),
      save: manager.save,
      manager: {
        transaction: (run: (m: typeof manager) => unknown) => run(manager),
      },
    };
    const service = new LabourPaymentsService(
      repo as unknown as Repository<LabourPayment>,
      { createQueryBuilder: () => query } as unknown as Repository<DailyWorker>,
      {} as Repository<User>,
      { createForUser: jest.fn() } as unknown as NotificationsService,
    );
    return { service, repo, manager, workers };
  }

  it('excludes accounts-only approval from the payable summary', async () => {
    const { service } = setup(['approved', 'pending', 'rejected']);
    expect(await service.getUnpaidWeeklySummary()).toEqual([]);
  });

  it('totals only final admin-approved entries in a mixed week', async () => {
    const { service } = setup(['approved', 'admin_approved', 'pending']);
    expect(await service.getUnpaidWeeklySummary()).toEqual([
      expect.objectContaining({
        totalAmount: 100,
        entryCount: 1,
        projectNames: ['Highway'],
        teamNames: ['Masonry Team'],
      }),
    ]);
  });

  it('keeps two teams in separate payable rows in the same engineer week', async () => {
    const { service, workers } = setup(['admin_approved', 'admin_approved']);
    workers[1].tradeRel.team.name = 'Carpentry Team';
    const rows = await service.getUnpaidWeeklySummary();
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teamNames: ['Masonry Team'],
          totalAmount: 100,
          workerIds: ['worker-0'],
        }),
        expect.objectContaining({
          teamNames: ['Carpentry Team'],
          totalAmount: 100,
          workerIds: ['worker-1'],
        }),
      ]),
    );
  });

  it('pays only selected team entries and leaves the other team unattached', async () => {
    const { service, manager } = setup(['admin_approved', 'admin_approved']);
    const payment = await service.create(
      {
        userId: 'engineer',
        weekStart: '2026-10-12',
        weekEnd: '2026-10-18',
        paymentDate: '2026-10-23',
        workerIds: ['worker-0'],
        amount: 40,
        status: 'paid',
      },
      'accounts',
    );
    expect(payment.amount).toBe(100);
    expect(manager.update).toHaveBeenCalledWith(
      DailyWorker,
      { id: In(['worker-0']) },
      { labourPaymentId: 'payment' },
    );
  });

  it('rejects stale or ineligible selections without saving', async () => {
    const { service, repo } = setup(['admin_approved', 'approved']);
    await expect(
      service.create(
        {
          userId: 'engineer',
          weekStart: '2026-10-12',
          weekEnd: '2026-10-18',
          paymentDate: '2026-10-23',
          workerIds: ['worker-0', 'worker-1'],
          amount: 40,
        },
        'accounts',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rejects recording payment for accounts-only approved entries', async () => {
    const { service, repo } = setup(['approved']);
    await expect(
      service.create(
        {
          userId: 'engineer',
          weekStart: '2026-10-12',
          weekEnd: '2026-10-18',
          paymentDate: '2026-10-23',
        },
        'accounts',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('records a partial installment and keeps the balance open', async () => {
    const { service, manager } = setup(['admin_approved']);
    const payment = await service.create(
      {
        userId: 'engineer',
        weekStart: '2026-10-12',
        weekEnd: '2026-10-18',
        paymentDate: '2026-10-23',
        status: 'paid',
        amount: 40,
        paymentMode: 'upi',
        referenceNumber: 'REF-1',
      },
      'accounts',
    );
    expect(payment.amount).toBe(100);
    expect(payment.status).toBe('partial');
    expect(payment.paymentHistory).toEqual([
      expect.objectContaining({
        amount: 40,
        paymentDate: '2026-10-23',
        paymentMode: 'upi',
        referenceNumber: 'REF-1',
      }),
    ]);
    expect(manager.update).toHaveBeenCalled();
  });

  it('appends a second installment and marks the fully settled week paid', async () => {
    const { service, manager } = setup([]);
    manager.findOne.mockImplementation(async (entity: unknown) =>
      entity === User
        ? { id: 'engineer', name: 'Engineer' }
        : ({
            id: 'payment',
            userId: 'engineer',
            weekStart: '2026-10-12',
            weekEnd: '2026-10-18',
            amount: 100,
            status: 'partial',
            paymentHistory: [{ id: 'first', amount: 40 }],
          } as never),
    );
    const payment = await service.create(
      {
        paymentId: 'payment',
        userId: 'engineer',
        weekStart: '2026-10-12',
        weekEnd: '2026-10-18',
        paymentDate: '2026-10-24',
        amount: 60,
        paymentMode: 'cash',
      },
      'accounts',
    );
    expect(payment.status).toBe('paid');
    expect(payment.paymentHistory).toHaveLength(2);
    expect(payment.paymentHistory[0]).toEqual({ id: 'first', amount: 40 });
  });

  it('rejects installments above the remaining balance without saving', async () => {
    const { service, repo } = setup(['admin_approved']);
    await expect(
      service.create(
        {
          userId: 'engineer',
          weekStart: '2026-10-12',
          weekEnd: '2026-10-18',
          paymentDate: '2026-10-23',
          amount: 101,
        },
        'accounts',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('does not allow an existing fully paid legacy record to be paid twice', async () => {
    const { service, manager, repo } = setup([]);
    manager.findOne.mockImplementation(async (entity: unknown) =>
      entity === User
        ? { id: 'engineer', name: 'Engineer' }
        : ({
            id: 'payment',
            userId: 'engineer',
            weekStart: '2026-10-12',
            weekEnd: '2026-10-18',
            amount: 100,
            status: 'paid',
            paymentHistory: [],
          } as never),
    );
    await expect(
      service.create(
        {
          paymentId: 'payment',
          userId: 'engineer',
          weekStart: '2026-10-12',
          weekEnd: '2026-10-18',
          paymentDate: '2026-10-24',
          amount: 1,
        },
        'accounts',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rejects a payment record belonging to another engineer', async () => {
    const { service, manager, repo } = setup([]);
    manager.findOne.mockImplementation(async (entity: unknown) =>
      entity === User
        ? { id: 'engineer', name: 'Engineer' }
        : ({
            userId: 'another-engineer',
            weekStart: '2026-10-12',
            weekEnd: '2026-10-18',
          } as never),
    );
    await expect(
      service.create(
        {
          paymentId: 'payment',
          userId: 'engineer',
          weekStart: '2026-10-12',
          weekEnd: '2026-10-18',
          paymentDate: '2026-10-24',
          amount: 10,
        },
        'accounts',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
