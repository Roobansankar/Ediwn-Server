import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficeStaffService } from './office-staff.service.js';
import { OfficeStaffController } from './office-staff.controller.js';
import { User } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project])],
  controllers: [OfficeStaffController],
  providers: [OfficeStaffService],
  exports: [OfficeStaffService],
})
export class OfficeStaffModule {}
