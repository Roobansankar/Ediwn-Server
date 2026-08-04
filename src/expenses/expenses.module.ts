import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';
import { Expense } from './entities/expense.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Payment])],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
