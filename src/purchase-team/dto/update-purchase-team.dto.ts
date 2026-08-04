import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseTeamDto } from './create-purchase-team.dto.js';

export class UpdatePurchaseTeamDto extends PartialType(CreatePurchaseTeamDto) {}
