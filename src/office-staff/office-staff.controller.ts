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
import { OfficeStaffService } from './office-staff.service.js';
import { CreateOfficeStaffDto } from './dto/create-office-staff.dto.js';
import { UpdateOfficeStaffDto } from './dto/update-office-staff.dto.js';

@ApiTags('Office Staff')
@Controller({ path: 'office-staff', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class OfficeStaffController {
  constructor(private readonly officeStaffService: OfficeStaffService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new office staff member' })
  create(@Body() dto: CreateOfficeStaffDto) {
    return this.officeStaffService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'List all office staff members' })
  findAll() {
    return this.officeStaffService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Get an office staff member by ID' })
  findOne(@Param('id') id: string) {
    return this.officeStaffService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an office staff member' })
  update(@Param('id') id: string, @Body() dto: UpdateOfficeStaffDto) {
    return this.officeStaffService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate an office staff member' })
  remove(@Param('id') id: string) {
    return this.officeStaffService.remove(id);
  }
}
