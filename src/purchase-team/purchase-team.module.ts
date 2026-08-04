import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { Salary } from '../salaries/entities/salary.entity.js';
import { PurchaseTeamService } from './purchase-team.service.js';
import { PurchaseTeamController } from './purchase-team.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project, Salary])],
  controllers: [PurchaseTeamController],
  providers: [PurchaseTeamService],
  exports: [PurchaseTeamService],
})
export class PurchaseTeamModule {}
