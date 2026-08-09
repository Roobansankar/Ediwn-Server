import {
  Controller,
  Get,
  Post,
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
import { Role, InvoiceStatus } from '../common/enums.js';
import { AccountsService } from './accounts.service.js';
import { CreateInvoiceDto } from './dto/accounts.dto.js';

@ApiTags('Invoices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller({ path: 'invoices', version: '1' })
export class InvoicesController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.OFFICE_STAFF)
  @ApiOperation({ summary: 'Create sales invoice' })
  createInvoice(@Body() dto: CreateInvoiceDto, @Request() req: any) {
    return this.accountsService.createInvoice(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.OFFICE_STAFF)
  @ApiOperation({ summary: 'List invoices' })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'projectId', required: false })
  findInvoices(
    @Query('status') status?: InvoiceStatus,
    @Query('projectId') projectId?: string,
  ) {
    return this.accountsService.findInvoices({ status, projectId });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.OFFICE_STAFF)
  @ApiOperation({ summary: 'Get single invoice' })
  findInvoice(@Param('id') id: string) {
    return this.accountsService.findInvoice(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.OFFICE_STAFF)
  @ApiOperation({ summary: 'Update invoice status' })
  updateInvoiceStatus(
    @Param('id') id: string,
    @Body('status') status: InvoiceStatus,
  ) {
    return this.accountsService.updateInvoiceStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.OFFICE_STAFF)
  @ApiOperation({ summary: 'Delete invoice' })
  removeInvoice(@Param('id') id: string) {
    return this.accountsService.removeInvoice(id);
  }
}
