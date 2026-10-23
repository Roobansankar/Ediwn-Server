import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LabourPaymentsService } from './labour-payments.service.js';
import { LabourPayment } from './entities/labour-payment.entity.js';
import { DailyWorker } from '../daily-labour/entities/daily-worker.entity.js';
import { User } from '../users/entities/user.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';

describe('Labour payment approval eligibility', () => {
  function setup(statuses: string[]) {
    let allowed: string[] = [];
    const workers = statuses.map((status) => ({
      status, count: 1, shift: 1, shiftAmount: 100,
      tradeRel: { team: { name: 'Masonry Team' } },
      report: { reportDate: '2026-10-12', createdById: 'engineer', createdBy: { name: 'Engineer' }, project: { name: 'Highway' } },
    }));
    const query = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockImplementation(filter),
      andWhere: jest.fn().mockImplementation(filter),
      getMany: jest.fn(async () => workers.filter((worker) => allowed.includes(worker.status))),
    };
    function filter(_sql: string, params?: { statuses?: string[] }) {
      if (params?.statuses) allowed = params.statuses;
      return query;
    }
    const repo = { create: jest.fn(), save: jest.fn() };
    const service = new LabourPaymentsService(
      repo as unknown as Repository<LabourPayment>,
      { createQueryBuilder: () => query } as unknown as Repository<DailyWorker>,
      {} as Repository<User>,
      {} as NotificationsService,
    );
    return { service, repo };
  }

  it('excludes accounts-only approval from the payable summary', async () => {
    const { service } = setup(['approved', 'pending', 'rejected']);
    expect(await service.getUnpaidWeeklySummary()).toEqual([]);
  });

  it('totals only final admin-approved entries in a mixed week', async () => {
    const { service } = setup(['approved', 'admin_approved', 'pending']);
    expect(await service.getUnpaidWeeklySummary()).toEqual([
      expect.objectContaining({ totalAmount: 100, entryCount: 1, projectNames: ['Highway'], teamNames: ['Masonry Team'] }),
    ]);
  });

  it('rejects recording payment for accounts-only approved entries', async () => {
    const { service, repo } = setup(['approved']);
    await expect(service.create({
      userId: 'engineer', weekStart: '2026-10-12', weekEnd: '2026-10-18', paymentDate: '2026-10-23',
    }, 'accounts')).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
