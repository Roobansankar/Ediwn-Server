import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { PurchaseEnquiriesService } from './purchase-enquiries.service.js';
import { CreatePurchaseEnquiryDto } from './dto/create-purchase-enquiry.dto.js';
import { UpdatePurchaseEnquiryStatusDto } from './dto/update-purchase-enquiry-status.dto.js';

@ApiTags('Material Requirements')
@Controller({ path: 'purchase-enquiries', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PurchaseEnquiriesController {
  constructor(private readonly service: PurchaseEnquiriesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Create a purchase enquiry' })
  create(@Body() dto: CreatePurchaseEnquiryDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'List purchase enquiries' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Get single purchase enquiry' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Update purchase enquiry' })
  update(
    @Param('id') id: string,
    @Body() dto: CreatePurchaseEnquiryDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update purchase enquiry status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseEnquiryStatusDto,
    @Request() req: any,
  ) {
    return this.service.updateStatus(id, dto.status, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Delete purchase enquiry' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
