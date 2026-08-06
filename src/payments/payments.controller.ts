import {
  Controller,
  Get,
  Post,
  Body,
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
import { Role, PaymentType } from '../common/enums.js';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create payment' })
  create(@Body() dto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'type', required: false, enum: PaymentType })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'purchaseOrderId', required: false })
  @ApiQuery({ name: 'subcontractWorkOrderId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  findAll(
    @Query('type') type?: PaymentType,
    @Query('projectId') projectId?: string,
    @Query('purchaseOrderId') purchaseOrderId?: string,
    @Query('subcontractWorkOrderId') subcontractWorkOrderId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.findAll({
      type,
      projectId,
      purchaseOrderId,
      subcontractWorkOrderId,
      dateFrom,
      dateTo,
      page,
      limit,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Payment-type-wise totals' })
  getSummary() {
    return this.paymentsService.getSummary();
  }

  @Post('sync-expenses')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Sync missing expenses to ledger' })
  syncExpenses() {
    return this.paymentsService.syncExpenses();
  }
}
