import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  findAll(@Request() req: any) {
    return this.service.findByUser(req.user.id, req.user.role);
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
}
