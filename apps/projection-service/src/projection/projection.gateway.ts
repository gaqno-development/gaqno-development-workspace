import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';

const ORG_ROOM_PREFIX = 'org:';

@WebSocketGateway({ cors: true })
export class ProjectionGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly orgBySocket = new Map<string, string>();

  handleConnection(client: Socket): void {
    const orgId = (client.handshake.query?.orgId ?? client.handshake.headers?.['x-org-id']) as string | undefined;
    if (typeof orgId === 'string' && orgId.trim()) {
      const room = ORG_ROOM_PREFIX + orgId.trim();
      client.join(room);
      this.orgBySocket.set(client.id, orgId.trim());
    }
  }

  emitToOrg(orgId: string, payload: unknown): void {
    this.server.to(ORG_ROOM_PREFIX + orgId).emit('projection', payload);
  }
}
