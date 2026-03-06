import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { KafkaConsumer, TopicRegistry } from "@gaqno-development/backcore";
import { RedisService } from "../redis/redis.service";

const UI_EVENT_TYPES = new Set([
  "atendimento.message_received",
  "atendimento.message_sent",
  "comercial.opportunity_won",
  "comercial.opportunity_lost",
  "comercial.sale_completed",
  "operacoes.order_shipped",
  "financeiro.payment_received",
  "pdv.sale_completed",
  "customer.created",
  "customer.updated",
]);

@Injectable()
export class BridgeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BridgeService.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumer,
    private readonly topics: TopicRegistry,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.kafkaConsumer.connect();
      this.logger.log("Kafka consumer connected");
    } catch (err: unknown) {
      this.logger.warn(
        `Kafka connection failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    const topicList = [
      this.topics.comercialEvents,
      this.topics.atendimentoEvents,
      this.topics.operacoesEvents,
      this.topics.financeiroEvents,
      this.topics.pdvEvents,
      this.topics.customerEvents,
    ];

    for (const topic of topicList) {
      try {
        await this.kafkaConsumer.subscribe(topic, async ({ value }) => {
          await this.handleMessage(value);
        });
        this.logger.log(`Subscribed to ${topic}`);
      } catch (err: unknown) {
        this.logger.warn(
          `Subscribe failed for ${topic}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.kafkaConsumer.disconnect();
    } catch {}
  }

  private async handleMessage(rawValue: string): Promise<void> {
    try {
      const event = JSON.parse(rawValue) as {
        eventType?: string;
        tenantId?: string;
        [key: string]: unknown;
      };
      const eventType = String(event.eventType ?? event.type ?? "");
      const tenantId = event.tenantId ?? (event.data as { tenantId?: string } | undefined)?.tenantId;

      if (!tenantId || !eventType) {
        return;
      }
      if (!UI_EVENT_TYPES.has(eventType)) {
        return;
      }

      const channel = this.redis.channelForTenant(tenantId);
      const count = await this.redis.publish(channel, rawValue);
      if (count > 0) {
        this.logger.debug(`Forwarded ${eventType} to ${channel}`);
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Bridge handle error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
