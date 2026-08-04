import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { AccountsManagersService } from './accounts-managers.service.js';
import { CreateAccountsManagerDto } from './dto/create-accounts-manager.dto.js';
import { UpdateAccountsManagerDto } from './dto/update-accounts-manager.dto.js';

@ApiTags('Accounts Managers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'accounts-managers', version: '1' })
export class AccountsManagersController {
  constructor(
    private readonly accountsManagersService: AccountsManagersService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new accounts manager' })
  create(@Body() createAccountsManagerDto: CreateAccountsManagerDto) {
    return this.accountsManagersService.create(createAccountsManagerDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all accounts managers' })
  findAll() {
    return this.accountsManagersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get an accounts manager by id' })
  findOne(@Param('id') id: string) {
    return this.accountsManagersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an accounts manager' })
  update(
    @Param('id') id: string,
    @Body() updateAccountsManagerDto: UpdateAccountsManagerDto,
  ) {
    return this.accountsManagersService.update(id, updateAccountsManagerDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an accounts manager' })
  remove(@Param('id') id: string) {
    return this.accountsManagersService.remove(id);
  }
}
