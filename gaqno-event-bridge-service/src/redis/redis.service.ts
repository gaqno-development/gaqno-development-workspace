import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const WS_CHANNEL_PREFIX = "ws:tenant:";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private readonly channelCallbacks = new Map<string, (message: string) => void>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>("REDIS_URL") ?? "redis://localhost:6379";
    this.client = new Redis(url, { maxRetriesPerRequest: 3 });
    this.client.on("error", (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
    this.subscriber = new Redis(url, { maxRetriesPerRequest: 3 });
    this.subscriber.on("error", (err) => {
      this.logger.warn(`Redis subscriber error: ${err.message}`);
    });
    this.subscriber.on("message", (channel: string, message: string) => {
      const cb = this.channelCallbacks.get(channel);
      if (cb) cb(message);
    });
    this.logger.log("Redis client and subscriber connected");
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
    this.channelCallbacks.clear();
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async publish(channel: string, message: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.publish(channel, message);
  }

  channelForTenant(tenantId: string): string {
    return `${WS_CHANNEL_PREFIX}${tenantId}`;
  }

  subscribe(channel: string, onMessage: (message: string) => void): void {
    if (this.channelCallbacks.has(channel)) {
      return;
    }
    this.channelCallbacks.set(channel, onMessage);
    if (this.subscriber) {
      this.subscriber.subscribe(channel).catch((err) => {
        this.logger.warn(`Redis subscribe failed for ${channel}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }
}
