declare module 'socket.io' {
  import type { Server as HttpServer } from 'http';
  export class Server {
    to(room: string): { emit: (event: string, payload: unknown) => void };
  }
  export interface Socket {
    id: string;
    join(room: string): void;
    handshake: { query?: Record<string, string>; headers?: Record<string, string> };
  }
}
