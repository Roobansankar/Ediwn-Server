import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DprController } from './dpr.controller.js';
import { DprService } from './dpr.service.js';
import { DprReport } from './entities/dpr-report.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DprReport])],
  controllers: [DprController],
  providers: [DprService],
  exports: [DprService],
})
export class DprModule {}
