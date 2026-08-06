import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractWorkOrdersService } from './subcontract-work-orders.service.js';
import { SubcontractWorkOrdersController } from './subcontract-work-orders.controller.js';
import { SubcontractWorkOrder } from './entities/subcontract-work-order.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([SubcontractWorkOrder, Payment])],
  controllers: [SubcontractWorkOrdersController],
  providers: [SubcontractWorkOrdersService],
  exports: [SubcontractWorkOrdersService],
})
export class SubcontractWorkOrdersModule {}
