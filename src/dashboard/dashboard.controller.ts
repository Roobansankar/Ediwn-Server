import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('Dashboard')
@Controller({ path: 'dashboard', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('master')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get master dashboard KPIs' })
  getMaster() {
    return this.dashboardService.getMasterDashboard();
  }

  @Get('accounts')
  @Roles(Role.ACCOUNTS_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Get accounts manager dashboard KPIs' })
  getAccounts() {
    return this.dashboardService.getAccountsDashboard();
  }

  @Get('purchase')
  @Roles(Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Get purchase team dashboard KPIs' })
  getPurchase(@Request() req: any) {
    return this.dashboardService.getPurchaseDashboard(req.user.id);
  }

  @Get('purchase/projects')
  @Roles(Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Get projects assigned to the current purchase team member' })
  getPurchaseAssignedProjects(@Request() req: any) {
    return this.dashboardService.getPurchaseAssignedProjects(req.user.id);
  }

  @Get('engineer')
  @Roles(Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Get engineer dashboard KPIs' })
  getEngineer(@Request() req: any) {
    return this.dashboardService.getEngineerDashboard(req.user.id);
  }

  @Get('engineer/report')
  @Roles(Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Get comprehensive engineer report' })
  getEngineerReport(@Request() req: any) {
    return this.dashboardService.getEngineerReport(req.user);
  }

  @Get('engineer/projects')
  @Roles(Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Get projects assigned to the current site engineer' })
  getEngineerAssignedProjects(@Request() req: any) {
    return this.dashboardService.getAssignedProjectsForUser(req.user.id);
  }
}
