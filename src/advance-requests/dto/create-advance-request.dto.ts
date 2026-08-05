import { IsUUID, IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdvanceRequestDto {
  @ApiProperty({ example: 'uuid-of-vendor' })
  @IsUUID()
  vendorId: string;

  @ApiProperty({ example: 'uuid-of-project' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: 'MR-2026-001' })
  @IsString()
  @IsOptional()
  materialRequirementNo?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Advance needed to book materials' })
  @IsString()
  @IsOptional()
  notes?: string;
}
