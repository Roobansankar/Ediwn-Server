import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyLabourService } from './daily-labour.service.js';
import { DailyLabourController } from './daily-labour.controller.js';
import { DailyLabourReport } from './entities/daily-labour-report.entity.js';
import { DailyWorker } from './entities/daily-worker.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DailyLabourReport, DailyWorker])],
  controllers: [DailyLabourController],
  providers: [DailyLabourService],
})
export class DailyLabourModule {}
