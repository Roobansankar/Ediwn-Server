import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorBillsController } from './subcontractor-bills.controller.js';
import { SubcontractorBillsService } from './subcontractor-bills.service.js';
import { SubcontractorBill } from './entities/subcontractor-bill.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubcontractorEnquiry } from '../subcontractor-enquiries/entities/subcontractor-enquiry.entity.js';
import { SubcontractorWork } from '../subcontractor-work/entities/subcontractor-work.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([SubcontractorBill, SubcontractorEnquiry, SubcontractorWork]), NotificationsModule],
  controllers: [SubcontractorBillsController],
  providers: [SubcontractorBillsService],
  exports: [SubcontractorBillsService],
})
export class SubcontractorBillsModule {}
