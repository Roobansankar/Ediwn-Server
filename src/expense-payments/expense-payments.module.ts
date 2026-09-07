import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensePaymentsController } from './expense-payments.controller.js';
import { ExpensePaymentsService } from './expense-payments.service.js';
import { ExpensePayment } from './entities/expense-payment.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { User } from '../users/entities/user.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpensePayment, Expense, User]),
    NotificationsModule,
  ],
  controllers: [ExpensePaymentsController],
  providers: [ExpensePaymentsService],
})
export class ExpensePaymentsModule {}
