import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrawingsController } from './drawings.controller.js';
import { DrawingsService } from './drawings.service.js';
import { Drawing } from './entities/drawing.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Drawing])],
  controllers: [DrawingsController],
  providers: [DrawingsService],
  exports: [DrawingsService],
})
export class DrawingsModule {}
