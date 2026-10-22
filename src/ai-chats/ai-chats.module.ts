import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChat } from './entities/ai-chat.entity.js';
import { AiChatsController } from './ai-chats.controller.js';
import { AiChatsService } from './ai-chats.service.js';
import { ErpContextService } from './erp-context.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AiChat])],
  controllers: [AiChatsController],
  providers: [AiChatsService, ErpContextService],
})
export class AiChatsModule {}
