import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { PurchaseTodosService } from './purchase-todos.service.js';
import { CreatePurchaseTodoDto } from './dto/create-purchase-todo.dto.js';
import { UpdatePurchaseTodoDto } from './dto/update-purchase-todo.dto.js';

@ApiTags('Purchase Todos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'purchase-todos', version: '1' })
export class PurchaseTodosController {
  constructor(private readonly purchaseTodosService: PurchaseTodosService) {}

  @Get()
  @Roles(Role.PURCHASE_TEAM, Role.ADMIN)
  @ApiOperation({ summary: 'Get my private todo list' })
  findMine(@Request() req: any) {
    return this.purchaseTodosService.findMine(req.user.id);
  }

  @Post()
  @Roles(Role.PURCHASE_TEAM, Role.ADMIN)
  @ApiOperation({ summary: 'Add a todo to my list' })
  create(@Request() req: any, @Body() dto: CreatePurchaseTodoDto) {
    return this.purchaseTodosService.create(req.user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.PURCHASE_TEAM, Role.ADMIN)
  @ApiOperation({ summary: 'Update one of my todos' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdatePurchaseTodoDto,
  ) {
    return this.purchaseTodosService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @Roles(Role.PURCHASE_TEAM, Role.ADMIN)
  @ApiOperation({ summary: 'Delete one of my todos' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.purchaseTodosService.remove(id, req.user.id);
  }
}
