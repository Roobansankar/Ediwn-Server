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
import { ExpenseTypesService } from './expense-types.service.js';
import { CreateExpenseTypeDto } from './dto/create-expense-type.dto.js';

@ApiTags('Expense Types')
@Controller({ path: 'expense-types', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ExpenseTypesController {
  constructor(private readonly expenseTypesService: ExpenseTypesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Create Expense Type' })
  create(@Body() dto: CreateExpenseTypeDto) {
    return this.expenseTypesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all Expense Types' })
  findAll() {
    return this.expenseTypesService.findAll();
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update Expense Type' })
  update(@Param('id') id: string, @Body() dto: CreateExpenseTypeDto) {
    return this.expenseTypesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete Expense Type' })
  remove(@Param('id') id: string) {
    return this.expenseTypesService.remove(id);
  }
}
