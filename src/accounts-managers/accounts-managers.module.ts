import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { AccountsManagersService } from './accounts-managers.service.js';
import { AccountsManagersController } from './accounts-managers.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project])],
  controllers: [AccountsManagersController],
  providers: [AccountsManagersService],
  exports: [AccountsManagersService],
})
export class AccountsManagersModule {}
