import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

export const EVENT_BRIDGE_WS_EVENT = "event";

@WebSocketGateway({
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
})
@Injectable()
export class EventBridgeWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(EventBridgeWebSocketGateway.name);

  constructor(private readonly redis: RedisService) {}

  afterInit(): void {
    this.logger.log("Event Bridge WebSocket gateway initialized");
  }

  handleConnection(client: { id: string; handshake: { query: Record<string, string> }; join: (room: string) => void }): void {
    const tenantId = client.handshake.query?.tenantId ?? client.handshake.query?.tenant_id;
    this.logger.log(`Client connected: ${client.id} for tenant: ${tenantId ?? "unknown"}`);

    if (tenantId && typeof tenantId === "string") {
      const room = this.roomForTenant(tenantId);
      client.join(room);
      const channel = this.redis.channelForTenant(tenantId);
      this.redis.subscribe(channel, (message: string) => {
        try {
          const payload = JSON.parse(message);
          this.server.to(room).emit(EVENT_BRIDGE_WS_EVENT, payload);
        } catch {
          this.server.to(room).emit(EVENT_BRIDGE_WS_EVENT, { raw: message });
        }
      });
    }
  }

  handleDisconnect(client: { id: string }): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  roomForTenant(tenantId: string): string {
    return `tenant:${tenantId}`;
  }
}
