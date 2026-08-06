import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { Project } from './entities/project.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { ProjectProgress } from './entities/project-progress.entity.js';
import { ProjectMilestone } from './entities/project-milestone.entity.js';
import { ChangeOrder } from './entities/change-order.entity.js';
import { AttendanceLog } from './entities/attendance-log.entity.js';
import { MachineryLog } from './entities/machinery-log.entity.js';
import { SnagItem } from './entities/snag-item.entity.js';
import { SafetyIncident } from './entities/safety-incident.entity.js';
import { Rfi } from './entities/rfi.entity.js';
import { SitePhoto } from './entities/site-photo.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { SubcontractWorkOrder } from '../subcontract-work-orders/entities/subcontract-work-order.entity.js';
import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { SalesInvoice } from '../accounts/entities/sales-invoice.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ProjectCategory } from '../project-categories/entities/project-category.entity.js';
import { WeeklyTimesheet } from '../timesheet-attendance/entities/weekly-timesheet.entity.js';
import { DailyLabourReport } from '../daily-labour/entities/daily-labour-report.entity.js';
import { Trade } from '../trades/entities/trade.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Customer,
      User,
      ProjectCategory,
      ProjectProgress,
      ProjectMilestone,
      ChangeOrder,
      AttendanceLog,
      MachineryLog,
      SnagItem,
      SafetyIncident,
      Rfi,
      SitePhoto,
      Expense,
      SubcontractWorkOrder,
      PurchaseBill,
      SalesInvoice,
      Payment,
      WeeklyTimesheet,
      DailyLabourReport,
      Trade,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
