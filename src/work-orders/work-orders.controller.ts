import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role, WorkOrderStatus } from '../common/enums.js';
import { WorkOrdersService } from './work-orders.service.js';
import { CreateWorkOrderDto } from './dto/create-work-order.dto.js';
import {
  UpdateWorkOrderDto,
  UpdateWorkOrderStatusDto,
} from './dto/update-work-order.dto.js';

@ApiTags('Work Orders')
@Controller({ path: 'work-orders', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class WorkOrdersController {
  constructor(private readonly woService: WorkOrdersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Create a new work order' })
  create(@Body() dto: CreateWorkOrderDto, @Request() req: any) {
    return this.woService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List work orders' })
  @ApiQuery({ name: 'status', required: false, enum: WorkOrderStatus })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: WorkOrderStatus,
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.woService.findAll({ status, projectId, vendorId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single work order with items' })
  findOne(@Param('id') id: string) {
    return this.woService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update work order' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
    @Request() req: any,
  ) {
    return this.woService.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update work order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
    @Request() req: any,
  ) {
    return this.woService.updateStatus(id, dto.status, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a work order' })
  remove(@Param('id') id: string) {
    return this.woService.remove(id);
  }
}
