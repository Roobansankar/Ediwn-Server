import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialReceivedController } from './material-received.controller.js';
import { MaterialReceivedService } from './material-received.service.js';
import { MaterialReceived } from './entities/material-received.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialReceived])],
  controllers: [MaterialReceivedController],
  providers: [MaterialReceivedService],
  exports: [MaterialReceivedService],
})
export class MaterialReceivedModule {}
