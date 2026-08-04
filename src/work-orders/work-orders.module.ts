import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrdersController } from './work-orders.controller.js';
import { WorkOrdersService } from './work-orders.service.js';
import { WorkOrder } from './entities/work-order.entity.js';
import { WorkOrderItem } from './entities/work-order-item.entity.js';
import { Vendor } from '../vendors/entities/vendor.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, WorkOrderItem, Vendor])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
