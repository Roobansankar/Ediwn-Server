import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity.js';
import { TradesService } from './trades.service.js';
import { TradesController } from './trades.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Trade])],
  controllers: [TradesController],
  providers: [TradesService],
  exports: [TradesService],
})
export class TradesModule {}
