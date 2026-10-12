import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('Notifications')
@Controller({ path: 'notifications', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({ name: 'limit', required: false, description: 'How many to return (default 50, max 500)' })
  findAll(@Request() req: any, @Query('limit') limit?: string) {
    const parsed = Number(limit);
    return this.service.findByUser(req.user.id, req.user.role, Number.isFinite(parsed) && parsed > 0 ? parsed : 50);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count unread notifications for the current user' })
  unreadCount(@Request() req: any) {
    return this.service.unreadCount(req.user.id, req.user.role);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Request() req: any) {
    await this.service.markAllRead(req.user.id, req.user.role);
    return { success: true };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  async markRead(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    await this.service.markRead(id, req.user.id, req.user.role);
    return { success: true };
  }
}
