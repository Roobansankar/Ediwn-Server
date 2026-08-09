import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdvanceEntityType } from '../../common/enums.js';

export class InvoiceItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() quantity: number;
  @ApiPropertyOptional({ default: 'nos' })
  @IsString()
  @IsOptional()
  unit?: string;
  @ApiProperty() @IsNumber() rate: number;
}

export class CreateInvoiceDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() dueDate?: string;
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalAmount?: number;
  @ApiPropertyOptional({ type: [InvoiceItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];
}

export class BillItemDto {
  @ApiProperty() @IsUUID() poItemId: string;
  @ApiProperty() @IsNumber() quantity: number;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() unit?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() rate?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() orderedQty?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() billedQty?: number;
}

export class CreateBillDto {
  @ApiProperty() @IsUUID() vendorId: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() purchaseOrderId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() projectId?: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() gstPercent?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() gstAmount?: number;
  @ApiPropertyOptional() @IsDateString() @IsOptional() billDate?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() dueDate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billFileUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billFileKey?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiPropertyOptional({ type: [BillItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items?: BillItemDto[];
}

export class CreateAdvanceDto {
  @ApiProperty({ enum: AdvanceEntityType })
  @IsEnum(AdvanceEntityType)
  entityType: AdvanceEntityType;
  @ApiProperty() @IsUUID() entityId: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsDateString() date: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class CreateBoqDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() estimatedQty?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() estimatedRate?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() estimatedAmount?: number;
}
