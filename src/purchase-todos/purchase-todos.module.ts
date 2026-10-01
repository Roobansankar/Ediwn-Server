import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseTodo } from './entities/purchase-todo.entity.js';
import { PurchaseTodosService } from './purchase-todos.service.js';
import { PurchaseTodosController } from './purchase-todos.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseTodo])],
  controllers: [PurchaseTodosController],
  providers: [PurchaseTodosService],
  exports: [PurchaseTodosService],
})
export class PurchaseTodosModule {}
