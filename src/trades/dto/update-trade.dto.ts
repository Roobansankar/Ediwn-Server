import { PartialType } from '@nestjs/swagger';
import { CreateTradeDto } from './create-trade.dto.js';

export class UpdateTradeDto extends PartialType(CreateTradeDto) {}
