import { PartialType } from '@nestjs/swagger';
import { CreateSubcontractorEnquiryDto } from './create-subcontractor-enquiry.dto.js';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubcontractorEnquiryDto extends PartialType(CreateSubcontractorEnquiryDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: string;
}
