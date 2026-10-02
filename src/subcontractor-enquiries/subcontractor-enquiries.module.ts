import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorEnquiriesController } from './subcontractor-enquiries.controller.js';
import { SubcontractorEnquiriesService } from './subcontractor-enquiries.service.js';
import { SubcontractorEnquiry } from './entities/subcontractor-enquiry.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([SubcontractorEnquiry])],
  controllers: [SubcontractorEnquiriesController],
  providers: [SubcontractorEnquiriesService],
})
export class SubcontractorEnquiriesModule {}
