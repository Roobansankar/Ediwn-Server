import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { AccountsService } from './accounts.service.js';

@ApiTags('Accounts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller({ path: 'accounts', version: '1' })
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // --- Ledger / Summary ---
  @Get('ledger')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Derived transaction log' })
  getLedger() {
    return this.accountsService.getLedger();
  }

  @Get('payables')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Outstanding payables' })
  getPayables() {
    return this.accountsService.getPayables();
  }

  @Get('receivables')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Outstanding receivables' })
  getReceivables() {
    return this.accountsService.getReceivables();
  }

  @Get('balance')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Revenue vs cost summary' })
  getBalance() {
    return this.accountsService.getBalance();
  }
}
