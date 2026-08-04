import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller.js';
import { InvoicesController } from './invoices.controller.js';
import { BillsController } from './bills.controller.js';
import { OtherAccountsController } from './other.controller.js';
import { AccountsService } from './accounts.service.js';
import { SalesInvoice } from './entities/sales-invoice.entity.js';
import { InvoiceItem } from './entities/invoice-item.entity.js';
import { PurchaseBill } from './entities/purchase-bill.entity.js';
import { BoqItem } from './entities/boq-item.entity.js';
import { Advance } from './entities/advance.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { PoItem } from '../purchase-orders/entities/po-item.entity.js';
import { BillItem } from './entities/bill-item.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesInvoice,
      InvoiceItem,
      PurchaseBill,
      BillItem,
      BoqItem,
      Advance,
      Project,
      PurchaseOrder,
      PoItem,
    ]),
    NotificationsModule,
  ],
  controllers: [
    AccountsController,
    InvoicesController,
    BillsController,
    OtherAccountsController,
  ],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
