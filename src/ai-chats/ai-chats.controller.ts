import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { AiChatsService } from './ai-chats.service.js';
import { ErpContextService } from './erp-context.service.js';
import { ErpContextDto } from './erp-context.dto.js';

export class AppendChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  user: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40000)
  assistant: string;

  @IsInt()
  @Min(0)
  expectedCount: number;
}

@Controller({ path: 'ai-chats', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AiChatsController {
  constructor(
    private readonly chats: AiChatsService,
    private readonly erp: ErpContextService,
  ) {}

  @Get('erp/catalog')
  catalog() {
    return this.erp.catalog();
  }

  @Post('erp/context')
  context(@Body() dto: ErpContextDto) {
    return this.erp.context(dto);
  }

  @Get()
  list(@Request() req: { user: { id: string } }) {
    return this.chats.list(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }) {
    return this.chats.create(req.user.id);
  }

  @Get(':id')
  find(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.chats.find(id, req.user.id);
  }

  @Post(':id/messages')
  append(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: AppendChatDto,
  ) {
    return this.chats.append(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.chats.remove(id, req.user.id);
  }
}
