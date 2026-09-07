import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabourPaymentsController } from './labour-payments.controller.js';
import { LabourPaymentsService } from './labour-payments.service.js';
import { LabourPayment } from './entities/labour-payment.entity.js';
import { DailyWorker } from '../daily-labour/entities/daily-worker.entity.js';
import { User } from '../users/entities/user.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabourPayment, DailyWorker, User]),
    NotificationsModule,
  ],
  controllers: [LabourPaymentsController],
  providers: [LabourPaymentsService],
})
export class LabourPaymentsModule {}
