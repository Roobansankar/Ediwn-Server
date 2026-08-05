import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvanceRequestsController } from './advance-requests.controller.js';
import { AdvanceRequestsService } from './advance-requests.service.js';
import { AdvanceRequest } from './entities/advance-request.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdvanceRequest]),
    NotificationsModule,
  ],
  controllers: [AdvanceRequestsController],
  providers: [AdvanceRequestsService],
  exports: [AdvanceRequestsService],
})
export class AdvanceRequestsModule {}
