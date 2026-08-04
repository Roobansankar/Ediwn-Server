import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { Payment } from './entities/payment.entity.js';
import { PurchaseBill } from '../accounts/entities/purchase-bill.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PurchaseBill, Expense])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
