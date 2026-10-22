import 'reflect-metadata';
import { validate } from 'class-validator';
import { DataSource } from 'typeorm';
import { AiChatsController } from './ai-chats.controller.js';
import { ErpContextDto } from './erp-context.dto.js';
import { ErpContextService } from './erp-context.service.js';
import { ROLES_KEY } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';

describe('ERP knowledge access', () => {
  it('requires the admin role on the controller containing report endpoints', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AiChatsController)).toEqual([
      Role.ADMIN,
    ]);
  });

  it('rejects arbitrary datasets, SQL-like project IDs, and invalid dates', async () => {
    const dto = Object.assign(new ErpContextDto(), {
      domains: ['users', 'payments; DROP TABLE users'],
      projectId: "' OR true --",
      dateFrom: '2026-02-31',
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['domains', 'projectId', 'dateFrom']),
    );
  });

  it('rejects reversed ranges before reading the database', async () => {
    const transaction = jest.fn();
    const service = new ErpContextService({
      transaction,
    } as unknown as DataSource);
    await expect(
      service.context({
        domains: ['cashflow'],
        dateFrom: '2026-10-20',
        dateTo: '2026-10-01',
      }),
    ).rejects.toThrow('Start date must not be after end date');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('uses a consistent read-only transaction with a query timeout', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const transaction = jest.fn(
      async (
        _level: string,
        callback: (manager: { query: typeof query }) => Promise<unknown>,
      ) => callback({ query }),
    );
    const service = new ErpContextService({
      transaction,
    } as unknown as DataSource);
    const result = await service.context({ domains: [] });
    expect(transaction).toHaveBeenCalledWith(
      'REPEATABLE READ',
      expect.any(Function),
    );
    expect(query).toHaveBeenCalledWith('SET TRANSACTION READ ONLY');
    expect(query).toHaveBeenCalledWith(
      "SET LOCAL statement_timeout = '8000ms'",
    );
    expect(result.reports).toEqual([]);
  });
});
