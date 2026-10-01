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
import { VendorCategoriesService } from './vendor-categories.service.js';
import { CreateVendorCategoryDto } from './dto/create-vendor-category.dto.js';
import { UpdateVendorCategoryDto } from './dto/update-vendor-category.dto.js';

@ApiTags('Vendor Categories')
@Controller({ path: 'vendor-categories', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class VendorCategoriesController {
  constructor(
    private readonly vendorCategoriesService: VendorCategoriesService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create a new vendor category' })
  create(@Body() dto: CreateVendorCategoryDto) {
    return this.vendorCategoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all vendor categories' })
  findAll() {
    return this.vendorCategoriesService.findAll();
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update a vendor category' })
  update(@Param('id') id: string, @Body() dto: UpdateVendorCategoryDto) {
    return this.vendorCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Delete a vendor category' })
  remove(@Param('id') id: string) {
    return this.vendorCategoriesService.remove(id);
  }
}
