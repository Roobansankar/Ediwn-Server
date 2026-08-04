import { PartialType } from '@nestjs/swagger';
import { CreateOfficeStaffDto } from './create-office-staff.dto.js';

export class UpdateOfficeStaffDto extends PartialType(CreateOfficeStaffDto) {}
