import { IsString, IsUUID, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcontractorWorkDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsUUID()
  subcontractorId: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.subcontractWorkOrderId !== undefined && o.subcontractWorkOrderId !== '')
  @IsUUID()
  subcontractWorkOrderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
