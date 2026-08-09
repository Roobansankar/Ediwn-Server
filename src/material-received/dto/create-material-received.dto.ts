import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaterialReceivedItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(0) quantity: number;
}

export class CreateMaterialReceivedDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @ValidateIf((o) => o.purchaseOrderId !== undefined && o.purchaseOrderId !== '') @IsUUID() purchaseOrderId?: string;
  @ApiPropertyOptional() @ValidateIf((o) => o.receivedDate !== undefined && o.receivedDate !== '') @IsDateString() receivedDate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiProperty({ type: [MaterialReceivedItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialReceivedItemDto)
  items: MaterialReceivedItemDto[];
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  photoUrls?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  photoKeys?: string[];
  @ApiPropertyOptional() @IsString() @IsOptional() billUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billKey?: string;
}
