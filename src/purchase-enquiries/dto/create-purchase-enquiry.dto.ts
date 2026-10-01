import {
  IsString,
  IsUUID,
  IsArray,
  IsNumber,
  IsIn,
  IsDateString,
  Min,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnquiryItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(1) quantity: number;
  @ApiPropertyOptional() @IsString() @IsOptional() unit?: string;
}

export class CreatePurchaseEnquiryDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() vendorId?: string;
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiPropertyOptional({ description: 'Expected date & time (ISO string)' })
  @IsDateString()
  @IsOptional()
  expectedDate?: string;
  @ApiPropertyOptional({ enum: ['advance', 'credit', 'full_payment'] })
  @IsString()
  @IsIn(['advance', 'credit', 'full_payment'])
  @IsOptional()
  paymentTerms?: string;
  @ApiProperty({ type: [EnquiryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnquiryItemDto)
  items: EnquiryItemDto[];
}
