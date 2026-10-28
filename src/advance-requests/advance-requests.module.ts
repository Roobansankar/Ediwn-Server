import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvanceRequestsController } from './advance-requests.controller.js';
import { AdvanceRequestsService } from './advance-requests.service.js';
import { AdvanceRequest } from './entities/advance-request.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PurchaseEnquiry } from '../purchase-enquiries/entities/purchase-enquiry.entity.js';
import { VendorQuotation } from '../vendor-quotations/entities/vendor-quotation.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdvanceRequest,
      PurchaseEnquiry,
      VendorQuotation,
      PurchaseOrder,
      PurchaseBill,
      Payment,
    ]),
    NotificationsModule,
  ],
  controllers: [AdvanceRequestsController],
  providers: [AdvanceRequestsService],
  exports: [AdvanceRequestsService],
})
export class AdvanceRequestsModule {}
