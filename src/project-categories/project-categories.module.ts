import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectCategoriesService } from './project-categories.service.js';
import { ProjectCategoriesController } from './project-categories.controller.js';
import { ProjectCategory } from './entities/project-category.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectCategory])],
  controllers: [ProjectCategoriesController],
  providers: [ProjectCategoriesService],
  exports: [ProjectCategoriesService],
})
export class ProjectCategoriesModule {}
