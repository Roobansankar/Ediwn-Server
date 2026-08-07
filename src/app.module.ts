import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { VendorsModule } from './vendors/vendors.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { WorkOrdersModule } from './work-orders/work-orders.module.js';
import { DprModule } from './dpr/dpr.module.js';
import { DrawingsModule } from './drawings/drawings.module.js';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module.js';
import { AccountsModule } from './accounts/accounts.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { SubcontractorsModule } from './subcontractors/subcontractors.module.js';
import { WorkCategoriesModule } from './work-categories/work-categories.module.js';
import { SubcontractWorkOrdersModule } from './subcontract-work-orders/subcontract-work-orders.module.js';
import { SiteEngineersModule } from './site-engineers/site-engineers.module.js';
import { DailyLabourModule } from './daily-labour/daily-labour.module.js';
import { TradesModule } from './trades/trades.module.js';
import { ExpenseTypesModule } from './expense-types/expense-types.module.js';
import { AccountsManagersModule } from './accounts-managers/accounts-managers.module.js';
import { PurchaseTeamModule } from './purchase-team/purchase-team.module.js';
import { ItemDescriptionsModule } from './item-descriptions/item-descriptions.module.js';
import { PurchaseEnquiriesModule } from './purchase-enquiries/purchase-enquiries.module.js';
import { VendorQuotation } from './vendor-quotations/entities/vendor-quotation.entity.js';
import { SalariesModule } from './salaries/salaries.module.js';
import { TimesheetAttendanceModule } from './timesheet-attendance/timesheet-attendance.module.js';
import { ProjectCategoriesModule } from './project-categories/project-categories.module.js';
import { VendorQuotationsModule } from './vendor-quotations/vendor-quotations.module.js';
import { EmployeeQueriesModule } from './employee-queries/employee-queries.module.js';
import { SchemasModule } from './schemas/schemas.module.js';
import { OfficeStaffModule } from './office-staff/office-staff.module.js';
import { OfficeReportsModule } from './office-reports/office-reports.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { MaterialReceivedModule } from './material-received/material-received.module.js';
import { ProjectAccessModule } from './project-access/project-access.module.js';
import { AdvanceRequestsModule } from './advance-requests/advance-requests.module.js';
import { SubcontractorPaymentRequestsModule } from './subcontractor-payment-requests/subcontractor-payment-requests.module.js';
import { SubcontractorWorkModule } from './subcontractor-work/subcontractor-work.module.js';

// Entity imports
import { User } from './users/entities/user.entity.js';
import { Vendor } from './vendors/entities/vendor.entity.js';
import { Project } from './projects/entities/project.entity.js';
import { ProjectProgress } from './projects/entities/project-progress.entity.js';
import { ProjectMilestone } from './projects/entities/project-milestone.entity.js';
import { ChangeOrder } from './projects/entities/change-order.entity.js';
import { AttendanceLog } from './projects/entities/attendance-log.entity.js';
import { MachineryLog } from './projects/entities/machinery-log.entity.js';
import { SnagItem } from './projects/entities/snag-item.entity.js';
import { SafetyIncident } from './projects/entities/safety-incident.entity.js';
import { Rfi } from './projects/entities/rfi.entity.js';
import { SitePhoto } from './projects/entities/site-photo.entity.js';
import { WorkOrder } from './work-orders/entities/work-order.entity.js';
import { WorkOrderItem } from './work-orders/entities/work-order-item.entity.js';
import { DprReport } from './dpr/entities/dpr-report.entity.js';
import { Drawing } from './drawings/entities/drawing.entity.js';
import { PurchaseOrder } from './purchase-orders/entities/purchase-order.entity.js';
import { PoItem } from './purchase-orders/entities/po-item.entity.js';
import { SalesInvoice } from './accounts/entities/sales-invoice.entity.js';
import { InvoiceItem } from './accounts/entities/invoice-item.entity.js';
import { PurchaseBill } from './accounts/entities/purchase-bill.entity.js';
import { BillItem } from './accounts/entities/bill-item.entity.js';
import { BoqItem } from './accounts/entities/boq-item.entity.js';
import { Advance } from './accounts/entities/advance.entity.js';
import { Expense } from './expenses/entities/expense.entity.js';
import { ExpenseType } from './expense-types/entities/expense-type.entity.js';
import { Payment } from './payments/entities/payment.entity.js';
import { Subcontractor } from './subcontractors/entities/subcontractor.entity.js';
import { WorkCategory } from './work-categories/entities/work-category.entity.js';
import { SubcontractWorkOrder } from './subcontract-work-orders/entities/subcontract-work-order.entity.js';
import { DailyLabourReport } from './daily-labour/entities/daily-labour-report.entity.js';
import { DailyWorker } from './daily-labour/entities/daily-worker.entity.js';
import { Trade } from './trades/entities/trade.entity.js';
import { ItemDescription } from './item-descriptions/entities/item-description.entity.js';
import { PurchaseEnquiry } from './purchase-enquiries/entities/purchase-enquiry.entity.js';
import { Salary } from './salaries/entities/salary.entity.js';
import { WeeklyTimesheet } from './timesheet-attendance/entities/weekly-timesheet.entity.js';
import { TimesheetRow } from './timesheet-attendance/entities/timesheet-row.entity.js';
import { ProjectCategory } from './project-categories/entities/project-category.entity.js';
import { EmployeeQuery } from './employee-queries/entities/employee-query.entity.js';
import { OfficeReport } from './office-reports/entities/office-report.entity.js';
import { Notification } from './notifications/entities/notification.entity.js';
import { MaterialReceived } from './material-received/entities/material-received.entity.js';
import { ProjectAccess } from './project-access/entities/project-access.entity.js';
import { AdvanceRequest } from './advance-requests/entities/advance-request.entity.js';
import { SubcontractorPaymentRequest } from './subcontractor-payment-requests/entities/subcontractor-payment-request.entity.js';
import { SubcontractorWork } from './subcontractor-work/entities/subcontractor-work.entity.js';

function getBooleanConfig(
  configService: ConfigService,
  key: string,
  fallback: boolean,
) {
  const value = configService.get<string | boolean>(key);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }

  return fallback;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', '8220'),
        database: configService.get<string>('DATABASE_NAME', 'edwin_erp'),
        entities: [
          User,
          Vendor,
          Project,
          ProjectProgress,
          ProjectMilestone,
          ChangeOrder,
          AttendanceLog,
          MachineryLog,
          SnagItem,
          SafetyIncident,
          Rfi,
          SitePhoto,
          WorkOrder,
          WorkOrderItem,
          DprReport,
          Drawing,
          PurchaseOrder,
          PoItem,
          SalesInvoice,
          InvoiceItem,
          PurchaseBill,
          BillItem,
          BoqItem,
          Advance,
          Expense,
          Payment,
          Subcontractor,
          WorkCategory,
          SubcontractWorkOrder,
          DailyLabourReport,
          DailyWorker,
          Trade,
          ExpenseType,
          ItemDescription,
          PurchaseEnquiry,
          VendorQuotation,
          Salary,
          WeeklyTimesheet,
          TimesheetRow,
          ProjectCategory,
          EmployeeQuery,
          OfficeReport,
          Notification,
          MaterialReceived,
          ProjectAccess,
          AdvanceRequest,
          SubcontractorPaymentRequest,
          SubcontractorWork,
        ],
        // Always false — schema changes go through src/migrations only.
        // synchronize:true would auto-alter (and can silently drop) columns
        // to match the entity files on every boot; never wire this back up
        // to an env var.
        synchronize: false,
        logging: getBooleanConfig(configService, 'TYPEORM_LOGGING', false),
      }),
    }),
    AuthModule,
    UsersModule,
    VendorsModule,
    ProjectsModule,
    WorkOrdersModule,
    DprModule,
    DrawingsModule,
    PurchaseOrdersModule,
    AccountsModule,
    ExpensesModule,
    PaymentsModule,
    DashboardModule,
    SubcontractorsModule,
    WorkCategoriesModule,
    SubcontractWorkOrdersModule,
    SiteEngineersModule,
    DailyLabourModule,
    TradesModule,
    ExpenseTypesModule,
    AccountsManagersModule,
    PurchaseTeamModule,
    ItemDescriptionsModule,
    PurchaseEnquiriesModule,
    SalariesModule,
    TimesheetAttendanceModule,
    ProjectCategoriesModule,
    VendorQuotationsModule,
    EmployeeQueriesModule,
    SchemasModule,
    OfficeStaffModule,
    OfficeReportsModule,
    NotificationsModule,
    MaterialReceivedModule,
    ProjectAccessModule,
    AdvanceRequestsModule,
    SubcontractorPaymentRequestsModule,
    SubcontractorWorkModule,
  ],
})
export class AppModule {}
