import { SubcontractorBill } from '../subcontractor-bills/entities/subcontractor-bill.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorPaymentRequestsController } from './subcontractor-payment-requests.controller.js';
import { SubcontractorPaymentRequestsService } from './subcontractor-payment-requests.service.js';
import { SubcontractorPaymentRequest } from './entities/subcontractor-payment-request.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubcontractorPaymentRequest,
      SubcontractorBill,
      Payment,
    ]),
    NotificationsModule,
  ],
  controllers: [SubcontractorPaymentRequestsController],
  providers: [SubcontractorPaymentRequestsService],
  exports: [SubcontractorPaymentRequestsService],
})
export class SubcontractorPaymentRequestsModule {}
