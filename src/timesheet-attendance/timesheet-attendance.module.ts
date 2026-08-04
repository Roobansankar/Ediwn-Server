import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimesheetAttendanceController } from './timesheet-attendance.controller.js';
import { TimesheetAttendanceService } from './timesheet-attendance.service.js';
import { WeeklyTimesheet } from './entities/weekly-timesheet.entity.js';
import { TimesheetRow } from './entities/timesheet-row.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeeklyTimesheet, TimesheetRow, Payment, User]),
  ],
  controllers: [TimesheetAttendanceController],
  providers: [TimesheetAttendanceService],
  exports: [TimesheetAttendanceService],
})
export class TimesheetAttendanceModule {}
