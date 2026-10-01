import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsIn,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PoItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() quantity: number;
  @ApiPropertyOptional({ default: 'nos' })
  @IsString()
  @IsOptional()
  unit?: string;
  @ApiProperty() @IsNumber() rate: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty() @IsUUID() vendorId: string;
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() materialRequirementNo?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billFileUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billFileKey?: string;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() gstPercent?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() transportAmount?: number;
  @ApiPropertyOptional({ description: 'Expected date & time (ISO string)' })
  @IsDateString()
  @IsOptional()
  expectedDate?: string;
  @ApiPropertyOptional({ enum: ['advance', 'credit', 'full_payment'] })
  @IsString()
  @IsIn(['advance', 'credit', 'full_payment'])
  @IsOptional()
  paymentTerms?: string;
  @ApiProperty({ type: [PoItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoItemDto)
  items: PoItemDto[];
}
