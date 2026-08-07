import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
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
import { Role } from '../common/enums.js';
import { EmployeeQueriesService } from './employee-queries.service.js';
import { CreateEmployeeQueryDto } from './dto/create-employee-query.dto.js';
import { RespondEmployeeQueryDto } from './dto/respond-employee-query.dto.js';

@ApiTags('Employee Queries')
@Controller({ path: 'employee-queries', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class EmployeeQueriesController {
  constructor(private readonly service: EmployeeQueriesService) {}

  @Post()
  @Roles(
    Role.SITE_ENGINEER,
    Role.PURCHASE_TEAM,
    Role.ACCOUNTS_MANAGER,
    Role.OFFICE_STAFF,
    Role.ADMIN,
  )
  @ApiOperation({ summary: 'Request edit access for a locked timesheet' })
  create(@Body() dto: CreateEmployeeQueryDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(
    Role.ADMIN,
    Role.ACCOUNTS_MANAGER,
    Role.SITE_ENGINEER,
    Role.PURCHASE_TEAM,
    Role.OFFICE_STAFF,
  )
  @ApiOperation({ summary: 'List edit requests (admin sees all)' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status: string | undefined, @Request() req: any) {
    return this.service.findAll(req.user, status);
  }

  @Patch(':id/respond')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve (reopen timesheet) or reject request' })
  respond(
    @Param('id') id: string,
    @Body() dto: RespondEmployeeQueryDto,
    @Request() req: any,
  ) {
    return this.service.respond(id, dto, req.user.id);
  }
}
