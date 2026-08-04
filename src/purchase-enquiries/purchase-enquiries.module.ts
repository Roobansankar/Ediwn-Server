import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseEnquiriesController } from './purchase-enquiries.controller.js';
import { PurchaseEnquiriesService } from './purchase-enquiries.service.js';
import { PurchaseEnquiry } from './entities/purchase-enquiry.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseEnquiry]), NotificationsModule],
  controllers: [PurchaseEnquiriesController],
  providers: [PurchaseEnquiriesService],
  exports: [PurchaseEnquiriesService],
})
export class PurchaseEnquiriesModule {}
