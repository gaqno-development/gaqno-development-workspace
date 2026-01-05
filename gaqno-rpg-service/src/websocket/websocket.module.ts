import { Module, forwardRef } from '@nestjs/common';
import { RpgWebSocketGateway } from './websocket.gateway';
import { ActionsModule } from '../actions/actions.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [forwardRef(() => ActionsModule), forwardRef(() => SessionsModule)],
  providers: [RpgWebSocketGateway],
  exports: [RpgWebSocketGateway]
})
export class WebSocketModule {}

