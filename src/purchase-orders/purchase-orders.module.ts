import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersController } from './purchase-orders.controller.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { PoItem } from './entities/po-item.entity.js';
import { PurchaseEnquiry } from '../purchase-enquiries/entities/purchase-enquiry.entity.js';
import { AdvanceRequest } from '../advance-requests/entities/advance-request.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PoItem, PurchaseEnquiry, AdvanceRequest, Payment]),
    NotificationsModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
