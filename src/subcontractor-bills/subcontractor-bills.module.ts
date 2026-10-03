import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorBillsController } from './subcontractor-bills.controller.js';
import { SubcontractorBillsService } from './subcontractor-bills.service.js';
import { SubcontractorBill } from './entities/subcontractor-bill.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([SubcontractorBill]), NotificationsModule],
  controllers: [SubcontractorBillsController],
  providers: [SubcontractorBillsService],
  exports: [SubcontractorBillsService],
})
export class SubcontractorBillsModule {}
