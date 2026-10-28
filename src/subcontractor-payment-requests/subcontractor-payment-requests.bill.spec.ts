import { BadRequestException } from '@nestjs/common';
import { SubcontractorPaymentRequestsService } from './subcontractor-payment-requests.service.js';

function setup(status = 'approved', total = 150, paid = 20) {
  const bill = {
    id: 'bill',
    subcontractorId: 'subcontractor',
    projectId: 'project',
    subcontractWorkOrderId: 'po',
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
  const service = new SubcontractorPaymentRequestsService(
    repo as unknown as ConstructorParameters<
      typeof SubcontractorPaymentRequestsService
    >[0],
    notifications as unknown as ConstructorParameters<
      typeof SubcontractorPaymentRequestsService
    >[1],
    bills as unknown as ConstructorParameters<
      typeof SubcontractorPaymentRequestsService
    >[2],
    payments as unknown as ConstructorParameters<
      typeof SubcontractorPaymentRequestsService
    >[3],
  );
  const dto = {
    subcontractorBillId: 'bill',
    subcontractorId: 'subcontractor',
    projectId: 'project',
    subcontractWorkOrderId: 'po',
    amount: 120,
  };
  return { service, repo, bills, dto };
}

describe('Bill-based subcontractor payment requests', () => {
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

  it('uses the approved bill balance including earlier work-order payments and stores its reference', async () => {
    const { service, repo, dto } = setup();
    await service.create(dto, 'purchase');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subcontractorBillId: 'bill',
        subcontractWorkOrderId: 'po',
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

  it('rejects a mismatched subcontractor', async () => {
    const { service, repo, dto } = setup();
    await expect(
      service.create({ ...dto, subcontractorId: 'other' }, 'purchase'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
