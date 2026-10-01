import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorCategory } from './entities/vendor-category.entity.js';
import { VendorCategoriesService } from './vendor-categories.service.js';
import { VendorCategoriesController } from './vendor-categories.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([VendorCategory])],
  controllers: [VendorCategoriesController],
  providers: [VendorCategoriesService],
  exports: [VendorCategoriesService],
})
export class VendorCategoriesModule {}
