import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
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
import { ProjectAccessService } from './project-access.service.js';
import {
  ApproveProjectAccessDto,
  RevokeProjectAccessDto,
} from './dto/project-access.dto.js';

@ApiTags('Project Access')
@Controller({ path: 'project-access', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Roles(Role.ADMIN)
export class ProjectAccessController {
  constructor(private readonly accessService: ProjectAccessService) {}

  @Get('staff')
  @ApiOperation({
    summary: 'List office staff & accounts managers with access status',
  })
  @ApiQuery({ name: 'projectId', required: false })
  findStaff(@Query('projectId') projectId?: string) {
    return this.accessService.findStaff(projectId);
  }

  @Get()
  @ApiOperation({ summary: 'List all approved access records' })
  findAll() {
    return this.accessService.findAll();
  }

  @Post('approve')
  @ApiOperation({ summary: 'Approve project access for a staff member' })
  approve(@Body() dto: ApproveProjectAccessDto, @Request() req: any) {
    return this.accessService.approve(
      dto.projectId,
      dto.userId,
      dto.days,
      req.user.id,
    );
  }

  @Post('revoke')
  @ApiOperation({ summary: 'Revoke project access for a staff member' })
  revoke(@Body() dto: RevokeProjectAccessDto) {
    return this.accessService.revoke(dto.projectId, dto.userId);
  }

  @Post('mark-expired')
  @ApiOperation({ summary: 'Mark expired access records' })
  markExpired() {
    return this.accessService.markExpired();
  }
}
