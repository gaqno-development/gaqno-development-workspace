import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KafkaConsumer, TopicRegistry } from "@gaqno-development/backcore";
import axios from "axios";

@Injectable()
export class AutomationBridgeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationBridgeService.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumer,
    private readonly topics: TopicRegistry,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const webhookUrl = this.config.get<string>("N8N_WEBHOOK_URL");
    if (!webhookUrl) {
      this.logger.warn("N8N_WEBHOOK_URL not set; automation bridge will not POST events");
    }

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
          await this.forwardToWebhook(value);
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

  private async forwardToWebhook(rawValue: string): Promise<void> {
    const webhookUrl = this.config.get<string>("N8N_WEBHOOK_URL");
    if (!webhookUrl) return;

    try {
      const event = JSON.parse(rawValue);
      await axios.post(webhookUrl, event, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
      this.logger.debug(`Forwarded ${event.eventType ?? "event"} to n8n webhook`);
    } catch (err: unknown) {
      this.logger.warn(
        `Webhook POST failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
