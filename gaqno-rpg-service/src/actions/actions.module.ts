import { Module, forwardRef } from '@nestjs/common';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { NarratorModule } from '../narrator/narrator.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [NarratorModule, forwardRef(() => WebSocketModule)],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService]
})
export class ActionsModule {}

