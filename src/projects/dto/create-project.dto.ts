import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProjectStatus,
  ProjectNature,
  JobType,
  JobStatus,
} from '../../common/enums.js';

export class CreateProjectDto {
  @ApiProperty({ example: 'Highway Bridge Construction' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'PRJ-2026-001' })
  @IsString()
  projectCode: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

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
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  completionPct?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedBudget?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedGst?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedTotal?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectCategoryId?: string;

  @ApiPropertyOptional({ enum: ProjectNature })
  @IsEnum(ProjectNature)
  @IsOptional()
  projectNature?: ProjectNature;

  @ApiPropertyOptional({ enum: JobType })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnum(JobStatus)
  @IsOptional()
  jobStatus?: JobStatus;

  @ApiPropertyOptional({ example: '2026-2027' })
  @IsString()
  @IsOptional()
  financialYear?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfCreation?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  resourceIds?: string[];
}
