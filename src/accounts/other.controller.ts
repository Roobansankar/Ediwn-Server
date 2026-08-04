import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { AccountsService } from './accounts.service.js';
import { CreateBoqDto, CreateAdvanceDto } from './dto/accounts.dto.js';

@ApiTags('BOQ & Advances')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller({ version: '1' })
export class OtherAccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // --- BOQ ---
  @Post('boq')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Add BOQ item' })
  createBoq(@Body() dto: CreateBoqDto) {
    return this.accountsService.createBoq(dto);
  }

  @Get('boq/:projectId')
  @ApiOperation({ summary: 'BOQ items for project' })
  findBoq(@Param('projectId') projectId: string) {
    return this.accountsService.findBoq(projectId);
  }

  // --- Advances ---
  @Post('advances')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Create advance payment' })
  createAdvance(@Body() dto: CreateAdvanceDto, @Request() req: any) {
    return this.accountsService.createAdvance(dto, req.user.id);
  }

  @Get('advances')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'List advances' })
  findAdvances() {
    return this.accountsService.findAdvances();
  }
}
