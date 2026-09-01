import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubcontractWorkOrderDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsUUID()
  subcontractorId: string;

  @ApiProperty()
  @IsUUID()
  workCategoryId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNumber()
  gstPercentage: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  workorderUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  workorderKey?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
