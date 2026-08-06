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
import { SubcontractorPaymentRequestsService } from './subcontractor-payment-requests.service.js';
import { CreateSubcontractorPaymentRequestDto } from './dto/create-subcontractor-payment-request.dto.js';
import { RespondSubcontractorPaymentRequestDto } from './dto/respond-subcontractor-payment-request.dto.js';

@ApiTags('Subcontractor Payment Requests')
@Controller({ path: 'subcontractor-payment-requests', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SubcontractorPaymentRequestsController {
  constructor(private readonly service: SubcontractorPaymentRequestsService) {}

  @Post()
  @Roles(Role.PURCHASE_TEAM, Role.ADMIN)
  @ApiOperation({ summary: 'Request a payment for a subcontractor' })
  create(@Body() dto: CreateSubcontractorPaymentRequestDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'List subcontractor payment requests (admin/accounts see all)' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status: string | undefined, @Request() req: any) {
    return this.service.findAll(req.user, status);
  }

  @Patch(':id/respond')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Accept, give final admin approval, or reject a subcontractor payment request' })
  respond(
    @Param('id') id: string,
    @Body() dto: RespondSubcontractorPaymentRequestDto,
    @Request() req: any,
  ) {
    return this.service.respond(id, dto, req.user.id, req.user.role);
  }
}
