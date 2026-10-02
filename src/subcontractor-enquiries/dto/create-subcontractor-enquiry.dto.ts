import {
  IsString,
  IsUUID,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcontractorEnquiryDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsUUID() workCategoryId: string;
  @ApiProperty() @IsUUID() subcontractorId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() scopeOfWork?: string;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() totalAmount?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() gstPercent?: number;
  @ApiPropertyOptional() @IsDateString() @IsOptional() startDate?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() endDate?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() groupId?: string;
}
