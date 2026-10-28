import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdvanceRequestsService } from '../advance-requests/advance-requests.service.js';
import { SubcontractorPaymentRequestsService } from '../subcontractor-payment-requests/subcontractor-payment-requests.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { Role } from './enums.js';

function setup(kind: 'vendor' | 'subcontractor', status = 'pending') {
  const request = {
    id: 'request',
    status,
    amount: 100,
    requestedById: 'purchase',
  };
  const repo = {
    findOne: jest.fn().mockResolvedValue(request),
    create: jest.fn((data: object) => ({ id: 'request', ...data })),
    save: jest.fn((data: object) => Promise.resolve(data)),
    update: jest.fn((_id: string, data: object) => {
      Object.assign(request, data);
      return Promise.resolve({ affected: 1 });
    }),
  };
  const notifications = {
    createForRole: jest.fn().mockResolvedValue(undefined),
    createForUser: jest.fn().mockResolvedValue(undefined),
  };
  const notifier = notifications as unknown as NotificationsService;
  const service =
    kind === 'vendor'
      ? new AdvanceRequestsService(
          repo as unknown as ConstructorParameters<
            typeof AdvanceRequestsService
          >[0],
          {} as ConstructorParameters<typeof AdvanceRequestsService>[1],
          {} as ConstructorParameters<typeof AdvanceRequestsService>[2],
          {} as ConstructorParameters<typeof AdvanceRequestsService>[3],
          notifier,
          {
            findOne: jest.fn().mockResolvedValue({
              id: 'bill',
              vendorId: 'vendor',
              projectId: 'project',
              status: 'approved',
              amount: 100,
              paidAmount: 0,
            }),
          } as unknown as ConstructorParameters<
            typeof AdvanceRequestsService
          >[5],
          {
            find: jest.fn().mockResolvedValue([]),
          } as unknown as ConstructorParameters<
            typeof AdvanceRequestsService
          >[6],
        )
      : new SubcontractorPaymentRequestsService(
          repo as unknown as ConstructorParameters<
            typeof SubcontractorPaymentRequestsService
          >[0],
          notifier,
          {
            findOne: jest.fn().mockResolvedValue({
              id: 'bill',
              subcontractorId: 'subcontractor',
              projectId: 'project',
              status: 'approved',
              amount: 100,
              paidAmount: 0,
            }),
          } as unknown as ConstructorParameters<
            typeof SubcontractorPaymentRequestsService
          >[2],
          {
            find: jest.fn().mockResolvedValue([]),
          } as unknown as ConstructorParameters<
            typeof SubcontractorPaymentRequestsService
          >[3],
        );
  const create = () =>
    kind === 'vendor'
      ? (service as AdvanceRequestsService).create(
          {
            purchaseBillId: 'bill',
            vendorId: 'vendor',
            projectId: 'project',
            amount: 100,
          },
          'purchase',
        )
      : (service as SubcontractorPaymentRequestsService).create(
          {
            subcontractorBillId: 'bill',
            subcontractorId: 'subcontractor',
            projectId: 'project',
            amount: 100,
          },
          'purchase',
        );
  return { service, repo, notifications, create };
}

describe.each(['vendor', 'subcontractor'] as const)(
  '%s payment request approval routing',
  (kind) => {
    it('sends new purchase requests to Accounts on the Approvals page', async () => {
      const { create, notifications } = setup(kind);
      await create();
      expect(notifications.createForRole).toHaveBeenCalledWith(
        Role.ACCOUNTS_MANAGER,
        expect.objectContaining({ link: `/dashboard/approvals?tab=${kind}` }),
      );
    });

    it('sends Accounts-approved requests to Admin on the Approvals page', async () => {
      const { service, notifications, repo } = setup(kind);
      await service.respond(
        'request',
        { action: 'accepted' },
        'accounts',
        Role.ACCOUNTS_MANAGER,
      );
      expect(repo.update).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({ status: 'accepted' }),
      );
      expect(notifications.createForRole).toHaveBeenCalledWith(
        Role.ADMIN,
        expect.objectContaining({ link: `/dashboard/approvals?tab=${kind}` }),
      );
      expect(notifications.createForUser).toHaveBeenCalledWith(
        'purchase',
        expect.anything(),
      );
    });

    it('sends final Admin approval to Accounts on Payments with the approved amount', async () => {
      const { service, notifications, repo } = setup(kind, 'accepted');
      await service.respond(
        'request',
        { action: 'admin_approved', approvedAmount: 80 },
        'admin',
        Role.ADMIN,
      );
      expect(repo.update).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          status: 'admin_approved',
          approvedAmount: 80,
        }),
      );
      expect(notifications.createForRole).toHaveBeenCalledWith(
        Role.ACCOUNTS_MANAGER,
        expect.objectContaining({ link: `/dashboard/payments?tab=${kind}` }),
      );
    });

    it('prevents Admin from performing the Accounts approval', async () => {
      const { service, repo } = setup(kind);
      await expect(
        service.respond('request', { action: 'accepted' }, 'admin', Role.ADMIN),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('prevents Accounts from giving final Admin approval', async () => {
      const { service, repo } = setup(kind, 'accepted');
      await expect(
        service.respond(
          'request',
          { action: 'admin_approved' },
          'accounts',
          Role.ACCOUNTS_MANAGER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('prevents final approval before Accounts approval', async () => {
      const { service, repo } = setup(kind);
      await expect(
        service.respond(
          'request',
          { action: 'admin_approved' },
          'admin',
          Role.ADMIN,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('lets Admin reject after Accounts approval', async () => {
      const { service, repo } = setup(kind, 'accepted');
      await service.respond(
        'request',
        { action: 'rejected' },
        'admin',
        Role.ADMIN,
      );
      expect(repo.update).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({ status: 'rejected' }),
      );
    });

    it('prevents rejection after final approval', async () => {
      const { service, repo } = setup(kind, 'admin_approved');
      await expect(
        service.respond('request', { action: 'rejected' }, 'admin', Role.ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  },
);
