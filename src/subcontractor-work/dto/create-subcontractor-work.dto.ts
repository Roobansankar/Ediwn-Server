import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcontractorWorkDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsUUID()
  subcontractorId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
