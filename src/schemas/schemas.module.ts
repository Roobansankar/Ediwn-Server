import { Module } from '@nestjs/common';
import { SchemasController } from './schemas.controller.js';
import { SchemasService } from './schemas.service.js';

@Module({
  controllers: [SchemasController],
  providers: [SchemasService],
})
export class SchemasModule {}
