import { PartialType } from '@nestjs/swagger';
import { CreateSalaryDto } from './create-salary.dto.js';

export class UpdateSalaryDto extends PartialType(CreateSalaryDto) {}
