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
import { LabourPaymentsService } from './labour-payments.service.js';
import { CreateLabourPaymentDto } from './dto/create-labour-payment.dto.js';
import { UpdateLabourPaymentStatusDto } from './dto/update-labour-payment-status.dto.js';

@ApiTags('Labour Payments')
@Controller({ path: 'labour-payments', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
export class LabourPaymentsController {
  constructor(private readonly service: LabourPaymentsService) {}

  @Get('unpaid-summary')
  @ApiOperation({
    summary:
      'Admin-approved trade entries not yet paid, grouped by site engineer and week',
  })
  getUnpaidWeeklySummary() {
    return this.service.getUnpaidWeeklySummary();
  }

  @Get()
  @ApiOperation({ summary: 'List recorded weekly labour payments' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Record a site engineer's weekly labour payment" })
  create(@Body() dto: CreateLabourPaymentDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: "Update a recorded payment's status (pending/paid)",
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLabourPaymentStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
