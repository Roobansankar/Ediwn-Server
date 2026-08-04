import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficeReportsController } from './office-reports.controller.js';
import { OfficeReportsService } from './office-reports.service.js';
import { OfficeReport } from './entities/office-report.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([OfficeReport])],
  controllers: [OfficeReportsController],
  providers: [OfficeReportsService],
  exports: [OfficeReportsService],
})
export class OfficeReportsModule {}
