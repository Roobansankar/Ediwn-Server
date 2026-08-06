import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorPaymentRequestsController } from './subcontractor-payment-requests.controller.js';
import { SubcontractorPaymentRequestsService } from './subcontractor-payment-requests.service.js';
import { SubcontractorPaymentRequest } from './entities/subcontractor-payment-request.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubcontractorPaymentRequest]),
    NotificationsModule,
  ],
  controllers: [SubcontractorPaymentRequestsController],
  providers: [SubcontractorPaymentRequestsService],
  exports: [SubcontractorPaymentRequestsService],
})
export class SubcontractorPaymentRequestsModule {}
