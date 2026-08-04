import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { TimesheetAttendanceService } from './timesheet-attendance.service.js';
import { CreateTimesheetDto } from './dto/create-timesheet.dto.js';

@ApiTags('Timesheet Attendance')
@Controller({ path: 'timesheet-attendance', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class TimesheetAttendanceController {
  constructor(private readonly service: TimesheetAttendanceService) {}

  @Post()
  @Roles(Role.SITE_ENGINEER, Role.PURCHASE_TEAM, Role.ADMIN, Role.OFFICE_STAFF, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Save weekly timesheet' })
  create(@Body() dto: CreateTimesheetDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get('all')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Get all timesheets (admin/accounts)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(status, page ? +page : 1, limit ? +limit : 50);
  }

  @Get('current')
  @Roles(Role.SITE_ENGINEER, Role.PURCHASE_TEAM, Role.ADMIN, Role.OFFICE_STAFF, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Get timesheet for a week' })
  getCurrent(@Query('weekStart') weekStart: string, @Request() req: any) {
    return this.service.findByWeek(req.user.id, weekStart);
  }

  @Get(':id')
  @Roles(
    Role.SITE_ENGINEER,
    Role.ADMIN,
    Role.ACCOUNTS_MANAGER,
    Role.PURCHASE_TEAM,
  )
  @ApiOperation({ summary: 'Get timesheet by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SITE_ENGINEER, Role.PURCHASE_TEAM, Role.ADMIN, Role.OFFICE_STAFF, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update timesheet' })
  update(
    @Param('id') id: string,
    @Body() dto: CreateTimesheetDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Patch(':id/submit')
  @Roles(Role.SITE_ENGINEER, Role.PURCHASE_TEAM, Role.ADMIN, Role.OFFICE_STAFF, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Submit timesheet & lock it for editing' })
  submit(@Param('id') id: string, @Request() req: any) {
    return this.service.submit(id, req.user.id);
  }

  @Patch(':id/verify')
  @Roles(Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Verify timesheet (accounts team)' })
  verify(@Param('id') id: string, @Request() req: any) {
    return this.service.verify(id, req.user.id);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve timesheet & create payment (admin)' })
  approve(@Param('id') id: string, @Request() req: any) {
    return this.service.approve(id, req.user);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Reject timesheet' })
  reject(@Param('id') id: string, @Request() req: any) {
    return this.service.reject(id, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.SITE_ENGINEER, Role.PURCHASE_TEAM, Role.ADMIN, Role.OFFICE_STAFF, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Delete timesheet' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.id);
  }
}
