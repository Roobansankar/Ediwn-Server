import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { PurchaseTeamService } from './purchase-team.service.js';
import { CreatePurchaseTeamDto } from './dto/create-purchase-team.dto.js';
import { UpdatePurchaseTeamDto } from './dto/update-purchase-team.dto.js';

@ApiTags('Purchase Team')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'purchase-team', version: '1' })
export class PurchaseTeamController {
  constructor(private readonly purchaseTeamService: PurchaseTeamService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new purchase team member' })
  create(@Body() createPurchaseTeamDto: CreatePurchaseTeamDto) {
    return this.purchaseTeamService.create(createPurchaseTeamDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all purchase team members' })
  findAll() {
    return this.purchaseTeamService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get a purchase team member by id' })
  findOne(@Param('id') id: string) {
    return this.purchaseTeamService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a purchase team member' })
  update(
    @Param('id') id: string,
    @Body() updatePurchaseTeamDto: UpdatePurchaseTeamDto,
  ) {
    return this.purchaseTeamService.update(id, updatePurchaseTeamDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a purchase team member' })
  remove(@Param('id') id: string) {
    return this.purchaseTeamService.remove(id);
  }
}
