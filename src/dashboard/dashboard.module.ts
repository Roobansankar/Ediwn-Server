import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { Project } from '../projects/entities/project.entity.js';
import { ProjectMilestone } from '../projects/entities/project-milestone.entity.js';
import { AttendanceLog } from '../projects/entities/attendance-log.entity.js';
import { SalesInvoice } from '../accounts/entities/sales-invoice.entity.js';
import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { PurchaseEnquiry } from '../purchase-enquiries/entities/purchase-enquiry.entity.js';
import { MaterialReceived } from '../material-received/entities/material-received.entity.js';
import { WeeklyTimesheet } from '../timesheet-attendance/entities/weekly-timesheet.entity.js';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectMilestone,
      AttendanceLog,
      SalesInvoice,
      PurchaseBill,
      Expense,
      Payment,
      User,
      PurchaseOrder,
      PurchaseEnquiry,
      MaterialReceived,
      WeeklyTimesheet,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
