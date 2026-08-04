import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto.js';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone1?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone2?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  completionPct?: number;
}
