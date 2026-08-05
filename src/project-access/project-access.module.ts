import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectAccessController } from './project-access.controller.js';
import { ProjectAccessService } from './project-access.service.js';
import { ProjectAccess } from './entities/project-access.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectAccess, User, Project])],
  controllers: [ProjectAccessController],
  providers: [ProjectAccessService],
  exports: [ProjectAccessService],
})
export class ProjectAccessModule {}
