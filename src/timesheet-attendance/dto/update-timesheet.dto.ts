import { PartialType } from '@nestjs/swagger';
import { CreateTimesheetDto } from './create-timesheet.dto.js';

export class UpdateTimesheetDto extends PartialType(CreateTimesheetDto) {}
