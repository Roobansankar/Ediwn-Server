import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkCategoriesService } from './work-categories.service.js';
import { WorkCategoriesController } from './work-categories.controller.js';
import { WorkCategory } from './entities/work-category.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([WorkCategory])],
  controllers: [WorkCategoriesController],
  providers: [WorkCategoriesService],
  exports: [WorkCategoriesService],
})
export class WorkCategoriesModule {}
