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

export class EnquiryItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(1) quantity: number;
}

export class CreatePurchaseEnquiryDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() vendorId?: string;
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiProperty({ type: [EnquiryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnquiryItemDto)
  items: EnquiryItemDto[];
}
