import {
  IsString,
  IsUUID,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuotationItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(1) quantity: number;
}

export class CreateVendorQuotationDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() materialRequirementId?: string;
  @ApiProperty() @IsUUID() vendorId: string;
  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() totalAmount?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() groupId?: string;
}
