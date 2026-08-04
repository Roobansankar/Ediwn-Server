import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorQuotationsController } from './vendor-quotations.controller.js';
import { VendorQuotationsService } from './vendor-quotations.service.js';
import { VendorQuotation } from './entities/vendor-quotation.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([VendorQuotation])],
  controllers: [VendorQuotationsController],
  providers: [VendorQuotationsService],
})
export class VendorQuotationsModule {}
