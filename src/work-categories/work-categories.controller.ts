import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { WorkCategoriesService } from './work-categories.service.js';
import { CreateWorkCategoryDto } from './dto/create-work-category.dto.js';

@ApiTags('Work Categories')
@Controller({ path: 'work-categories', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class WorkCategoriesController {
  constructor(private readonly workCategoriesService: WorkCategoriesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create a new work category' })
  create(@Body() dto: CreateWorkCategoryDto) {
    return this.workCategoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all work categories' })
  findAll() {
    return this.workCategoriesService.findAll();
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a work category' })
  remove(@Param('id') id: string) {
    return this.workCategoriesService.remove(id);
  }
}
