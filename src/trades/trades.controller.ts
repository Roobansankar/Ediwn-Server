import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { TradesService } from './trades.service.js';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

@ApiTags('Trades')
@Controller({ path: 'trades', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Create a new trade' })
  create(@Body() dto: CreateTradeDto) {
    return this.tradesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trades' })
  findAll() {
    return this.tradesService.findAll();
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a trade' })
  update(@Param('id') id: string, @Body() dto: UpdateTradeDto) {
    return this.tradesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a trade' })
  remove(@Param('id') id: string) {
    return this.tradesService.remove(id);
  }
}
