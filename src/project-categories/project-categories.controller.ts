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
import { ProjectCategoriesService } from './project-categories.service.js';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto.js';

@ApiTags('Project Categories')
@Controller({ path: 'project-categories', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ProjectCategoriesController {
  constructor(
    private readonly projectCategoriesService: ProjectCategoriesService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Create a new project category' })
  create(@Body() dto: CreateProjectCategoryDto) {
    return this.projectCategoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all project categories' })
  findAll() {
    return this.projectCategoriesService.findAll();
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a project category' })
  remove(@Param('id') id: string) {
    return this.projectCategoriesService.remove(id);
  }
}
