import { IsString, IsOptional, IsNumber, Min, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimesheetRowDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ default: 'project' })
  @IsString()
  entryType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  remark?: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  monHours: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  tueHours: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  wedHours: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  thuHours: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  friHours: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  satHours: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  sunHours: number;
}
