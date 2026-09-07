import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ExpensePaymentsService } from './expense-payments.service.js';
import { CreateExpensePaymentDto } from './dto/create-expense-payment.dto.js';
import { UpdateExpensePaymentStatusDto } from './dto/update-expense-payment-status.dto.js';

@ApiTags('Expense Payments')
@Controller({ path: 'expense-payments', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
export class ExpensePaymentsController {
  constructor(private readonly service: ExpensePaymentsService) {}

  @Get('unpaid-summary')
  @ApiOperation({
    summary: 'Admin-approved expenses not yet paid, grouped by user and week',
  })
  getUnpaidWeeklySummary() {
    return this.service.getUnpaidWeeklySummary();
  }

  @Get()
  @ApiOperation({ summary: 'List recorded weekly expense payments' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Record a user's weekly expense payment" })
  create(@Body() dto: CreateExpensePaymentDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: "Update a recorded payment's status (pending/paid)",
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExpensePaymentStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
