import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorsService } from './subcontractors.service.js';
import { SubcontractorsController } from './subcontractors.controller.js';
import { Subcontractor } from './entities/subcontractor.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Subcontractor])],
  controllers: [SubcontractorsController],
  providers: [SubcontractorsService],
  exports: [SubcontractorsService],
})
export class SubcontractorsModule {}
