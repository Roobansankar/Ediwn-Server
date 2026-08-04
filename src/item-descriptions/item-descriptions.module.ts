import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemDescriptionsService } from './item-descriptions.service.js';
import { ItemDescriptionsController } from './item-descriptions.controller.js';
import { ItemDescription } from './entities/item-description.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ItemDescription])],
  controllers: [ItemDescriptionsController],
  providers: [ItemDescriptionsService],
  exports: [ItemDescriptionsService],
})
export class ItemDescriptionsModule {}
