import { PartialType } from '@nestjs/swagger';
import { CreateVendorQuotationDto } from './create-vendor-quotation.dto.js';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVendorQuotationDto extends PartialType(CreateVendorQuotationDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: string;
}
