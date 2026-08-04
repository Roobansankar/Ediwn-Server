import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteEngineersService } from './site-engineers.service.js';
import { SiteEngineersController } from './site-engineers.controller.js';
import { User } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project])],
  controllers: [SiteEngineersController],
  providers: [SiteEngineersService],
  exports: [SiteEngineersService],
})
export class SiteEngineersModule {}
