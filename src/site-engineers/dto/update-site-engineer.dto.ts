import { PartialType } from '@nestjs/swagger';
import { CreateSiteEngineerDto } from './create-site-engineer.dto.js';

export class UpdateSiteEngineerDto extends PartialType(CreateSiteEngineerDto) {}
