import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
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
  @ApiProperty({ type: [PoItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoItemDto)
  items: PoItemDto[];
}
