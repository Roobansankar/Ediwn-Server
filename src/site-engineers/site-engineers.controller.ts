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
import { SiteEngineersService } from './site-engineers.service.js';
import { CreateSiteEngineerDto } from './dto/create-site-engineer.dto.js';
import { UpdateSiteEngineerDto } from './dto/update-site-engineer.dto.js';

@ApiTags('Site Engineers')
@Controller({ path: 'site-engineers', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SiteEngineersController {
  constructor(private readonly siteEngineersService: SiteEngineersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new site engineer' })
  create(@Body() dto: CreateSiteEngineerDto) {
    return this.siteEngineersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'List all site engineers' })
  findAll() {
    return this.siteEngineersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Get a site engineer by ID' })
  findOne(@Param('id') id: string) {
    return this.siteEngineersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a site engineer' })
  update(@Param('id') id: string, @Body() dto: UpdateSiteEngineerDto) {
    return this.siteEngineersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a site engineer' })
  remove(@Param('id') id: string) {
    return this.siteEngineersService.remove(id);
  }
}
