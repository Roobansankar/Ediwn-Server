import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeQueriesController } from './employee-queries.controller.js';
import { EmployeeQueriesService } from './employee-queries.service.js';
import { EmployeeQuery } from './entities/employee-query.entity.js';
import { WeeklyTimesheet } from '../timesheet-attendance/entities/weekly-timesheet.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeQuery, WeeklyTimesheet]),
    NotificationsModule,
  ],
  controllers: [EmployeeQueriesController],
  providers: [EmployeeQueriesService],
  exports: [EmployeeQueriesService],
})
export class EmployeeQueriesModule {}
