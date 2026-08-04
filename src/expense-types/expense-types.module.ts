import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseType } from './entities/expense-type.entity.js';
import { ExpenseTypesService } from './expense-types.service.js';
import { ExpenseTypesController } from './expense-types.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseType])],
  controllers: [ExpenseTypesController],
  providers: [ExpenseTypesService],
  exports: [ExpenseTypesService],
})
export class ExpenseTypesModule {}
