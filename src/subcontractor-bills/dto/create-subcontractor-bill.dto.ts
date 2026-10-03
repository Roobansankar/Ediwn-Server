import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcontractorBillDto {
  @ApiProperty() @IsUUID() subcontractorId: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() subcontractWorkOrderId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() projectId?: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() gstPercent?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() gstAmount?: number;
  @ApiProperty() @IsDateString() billDate: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() dueDate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billFileUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billFileKey?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}
