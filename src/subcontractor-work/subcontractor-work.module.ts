import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorWorkController } from './subcontractor-work.controller.js';
import { SubcontractorWorkService } from './subcontractor-work.service.js';
import { SubcontractorWork } from './entities/subcontractor-work.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubcontractorWork]),
    NotificationsModule,
  ],
  controllers: [SubcontractorWorkController],
  providers: [SubcontractorWorkService],
  exports: [SubcontractorWorkService],
})
export class SubcontractorWorkModule {}
