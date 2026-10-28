import { BadRequestException } from '@nestjs/common';
import { AdvanceRequestsService } from './advance-requests.service.js';

function setup(status = 'approved', total = 150, paid = 20) {
  const bill = {
    id: 'bill',
    vendorId: 'vendor',
    projectId: 'project',
    purchaseOrderId: 'po',
    status,
    amount: total,
    paidAmount: paid,
  };
  const repo = {
    create: jest.fn((data: object) => data),
    save: jest.fn((data: object) => Promise.resolve(data)),
  };
  const bills = { findOne: jest.fn().mockResolvedValue(bill) };
  const payments = { find: jest.fn().mockResolvedValue([{ amount: 10 }]) };
  const notifications = {
    createForRole: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AdvanceRequestsService(
    repo as unknown as ConstructorParameters<typeof AdvanceRequestsService>[0],
    {} as ConstructorParameters<typeof AdvanceRequestsService>[1],
    {} as ConstructorParameters<typeof AdvanceRequestsService>[2],
    {} as ConstructorParameters<typeof AdvanceRequestsService>[3],
    notifications as unknown as ConstructorParameters<
      typeof AdvanceRequestsService
    >[4],
    bills as unknown as ConstructorParameters<typeof AdvanceRequestsService>[5],
    payments as unknown as ConstructorParameters<
      typeof AdvanceRequestsService
    >[6],
  );
  const dto = {
    purchaseBillId: 'bill',
    vendorId: 'vendor',
    projectId: 'project',
    purchaseOrderId: 'po',
    amount: 120,
  };
  return { service, repo, bills, dto };
}

describe('Bill-based vendor payment requests', () => {
  it.each(['pending', 'admin_approved', 'rejected'])(
    'rejects a bill with status %s before final approval',
    async (status) => {
      const { service, repo, dto } = setup(status);
      await expect(service.create(dto, 'purchase')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    },
  );

  it('uses the approved bill balance including earlier PO payments and stores its reference', async () => {
    const { service, repo, dto } = setup();
    await service.create(dto, 'purchase');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseBillId: 'bill',
        purchaseOrderId: 'po',
        amount: 120,
      }),
    );
  });

  it('rejects an amount exceeding the bill balance', async () => {
    const { service, repo, dto } = setup();
    await expect(
      service.create({ ...dto, amount: 121 }, 'purchase'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rejects a mismatched vendor', async () => {
    const { service, repo, dto } = setup();
    await expect(
      service.create({ ...dto, vendorId: 'other' }, 'purchase'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
