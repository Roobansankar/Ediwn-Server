import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkOrderItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ default: 'nos' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty()
  @IsNumber()
  rate: number;
}

export class CreateWorkOrderDto {
  @ApiProperty()
  @IsUUID()
  vendorId: string;

  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiProperty({ type: [WorkOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemDto)
  items: WorkOrderItemDto[];
}
