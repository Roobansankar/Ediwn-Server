import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { SchemasService } from './schemas.service.js';

@ApiTags('Schemas')
@Controller({ path: 'schemas', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SchemasController {
  constructor(private readonly schemasService: SchemasService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all database schema definitions with column metadata' })
  getAll() {
    return this.schemasService.getSchemas();
  }
}
