import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { AdvanceRequest } from '../advance-requests/entities/advance-request.entity.js';
import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { BillStatus, PaymentMode, PaymentType } from '../common/enums.js';

type Params = {
  requestStatus?: string;
  billStatus?: BillStatus;
  amount?: number;
  billId?: string;
  paid?: number;
  previous?: number;
};
function setup({
  requestStatus = 'admin_approved',
  billStatus = BillStatus.APPROVED,
  amount = 50,
  billId,
  paid = 20,
  previous = 0,
}: Params = {}) {
  const request = {
    id: 'request',
    purchaseBillId: 'bill',
    status: requestStatus,
    amount: 150,
    approvedAmount: 120,
    projectId: 'project',
    vendorId: 'vendor',
  };
  const bill = {
    id: 'bill',
    status: billStatus,
    amount: 150,
    paidAmount: paid,
    purchaseOrderId: 'po',
    projectId: 'project',
    vendorId: 'vendor',
  };
  const manager = {
    findOne: jest.fn((entity: unknown) =>
      Promise.resolve(
        entity === AdvanceRequest
          ? request
          : entity === PurchaseBill
            ? bill
            : null,
      ),
    ),
    find: jest.fn(
      (_entity: unknown, options: { where: { advanceRequestId?: string } }) =>
        Promise.resolve(
          options.where.advanceRequestId
            ? [{ amount: previous }]
            : [{ amount: 10 }],
        ),
    ),
    create: jest.fn((_entity: unknown, data: object) => ({
      id: 'payment',
      ...data,
    })),
    save: jest.fn((data: object) => Promise.resolve(data)),
  };
  const userQuery = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  const notifications = {
    createForRole: jest.fn().mockResolvedValue(undefined),
  };
  const service = new PaymentsService(
    {} as ConstructorParameters<typeof PaymentsService>[0],
    {} as ConstructorParameters<typeof PaymentsService>[1],
    {} as ConstructorParameters<typeof PaymentsService>[2],
    {} as ConstructorParameters<typeof PaymentsService>[3],
    { createQueryBuilder: () => userQuery } as unknown as ConstructorParameters<
      typeof PaymentsService
    >[4],
    {
      transaction: (run: (value: typeof manager) => Promise<unknown>) =>
        run(manager),
    } as unknown as ConstructorParameters<typeof PaymentsService>[5],
    notifications as unknown as ConstructorParameters<
      typeof PaymentsService
    >[6],
  );
  const dto = {
    paymentType: PaymentType.MATERIAL,
    advanceRequestId: 'request',
    purchaseBillId: billId,
    amount,
    paymentDate: '2026-10-27',
    paymentMode: PaymentMode.UPI,
  };
  return { service, manager, dto };
}

describe('Payments against an approved vendor bill request', () => {
  it('derives the bill from the request and records payment against it', async () => {
    const { service, manager, dto } = setup();
    const result = await service.create(dto, 'accounts');
    expect(result.purchaseBillId).toBe('bill');
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bill', paidAmount: 70 }),
    );
  });
  it.each(['pending', 'accepted'])(
    'blocks payment for request status %s',
    async (requestStatus) => {
      const { service, manager, dto } = setup({ requestStatus });
      await expect(service.create(dto, 'accounts')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    },
  );
  it('blocks a bill that no longer has final approval', async () => {
    const { service, manager, dto } = setup({
      billStatus: BillStatus.ADMIN_APPROVED,
    });
    await expect(service.create(dto, 'accounts')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('blocks a substituted bill id', async () => {
    const { service, manager, dto } = setup({ billId: 'other' });
    await expect(service.create(dto, 'accounts')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('blocks payment over the bill balance including older PO payments', async () => {
    const { service, manager, dto } = setup({ paid: 100, amount: 50 });
    await expect(service.create(dto, 'accounts')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('blocks payment over the request balance after earlier installments', async () => {
    const { service, manager, dto } = setup({ previous: 100, amount: 30 });
    await expect(service.create(dto, 'accounts')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });
});
