import { PartialType } from '@nestjs/swagger';
import { CreateItemDescriptionDto } from './create-item-description.dto.js';

export class UpdateItemDescriptionDto extends PartialType(
  CreateItemDescriptionDto,
) {}
