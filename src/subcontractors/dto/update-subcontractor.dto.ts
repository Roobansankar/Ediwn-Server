import { PartialType } from '@nestjs/swagger';
import { CreateSubcontractorDto } from './create-subcontractor.dto.js';

export class UpdateSubcontractorDto extends PartialType(
  CreateSubcontractorDto,
) {}
