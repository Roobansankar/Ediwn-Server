import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { ItemDescriptionsService } from './item-descriptions.service.js';
import { CreateItemDescriptionDto } from './dto/create-item-description.dto.js';
import { UpdateItemDescriptionDto } from './dto/update-item-description.dto.js';

@ApiTags('Item Descriptions')
@Controller({ path: 'item-descriptions', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ItemDescriptionsController {
  constructor(
    private readonly itemDescriptionsService: ItemDescriptionsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create a new item description' })
  create(@Body() dto: CreateItemDescriptionDto) {
    return this.itemDescriptionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all item descriptions' })
  findAll() {
    return this.itemDescriptionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item description by ID' })
  findOne(@Param('id') id: string) {
    return this.itemDescriptionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update an item description' })
  update(@Param('id') id: string, @Body() dto: UpdateItemDescriptionDto) {
    return this.itemDescriptionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an item description' })
  remove(@Param('id') id: string) {
    return this.itemDescriptionsService.remove(id);
  }
}
