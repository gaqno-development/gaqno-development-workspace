import { Module } from "@nestjs/common";
import { RedisModule } from "../redis/redis.module";
import { EventBridgeWebSocketGateway } from "./websocket.gateway";

@Module({
  imports: [RedisModule],
  providers: [EventBridgeWebSocketGateway],
  exports: [EventBridgeWebSocketGateway],
})
export class WebsocketModule {}
