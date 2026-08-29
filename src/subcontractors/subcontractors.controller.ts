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
import { SubcontractorsService } from './subcontractors.service.js';
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto.js';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto.js';

@ApiTags('Subcontractors')
@Controller({ path: 'subcontractors', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SubcontractorsController {
  constructor(private readonly subcontractorsService: SubcontractorsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create a new subcontractor' })
  create(@Body() dto: CreateSubcontractorDto) {
    return this.subcontractorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all subcontractors' })
  findAll() {
    return this.subcontractorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subcontractor by ID' })
  findOne(@Param('id') id: string) {
    return this.subcontractorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update a subcontractor' })
  update(@Param('id') id: string, @Body() dto: UpdateSubcontractorDto) {
    return this.subcontractorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a subcontractor' })
  remove(@Param('id') id: string) {
    return this.subcontractorsService.remove(id);
  }
}
