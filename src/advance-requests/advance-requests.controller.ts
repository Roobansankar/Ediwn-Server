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
import { AdvanceRequestsService } from './advance-requests.service.js';
import { CreateAdvanceRequestDto } from './dto/create-advance-request.dto.js';
import { RespondAdvanceRequestDto } from './dto/respond-advance-request.dto.js';

@ApiTags('Advance Requests')
@Controller({ path: 'advance-requests', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdvanceRequestsController {
  constructor(private readonly service: AdvanceRequestsService) {}

  @Post()
  @Roles(Role.PURCHASE_TEAM, Role.ADMIN)
  @ApiOperation({ summary: 'Request an advance for a vendor/MR' })
  create(@Body() dto: CreateAdvanceRequestDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'List advance requests (admin/accounts see all)' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status: string | undefined, @Request() req: any) {
    return this.service.findAll(req.user, status);
  }

  @Patch(':id/respond')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Accept or reject an advance request' })
  respond(
    @Param('id') id: string,
    @Body() dto: RespondAdvanceRequestDto,
    @Request() req: any,
  ) {
    return this.service.respond(id, dto, req.user.id);
  }
}
