import { IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TimesheetRowDto } from './timesheet-row.dto.js';

export class CreateTimesheetDto {
  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  weekStart: string;

  @ApiProperty({ type: [TimesheetRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimesheetRowDto)
  rows: TimesheetRowDto[];
}
