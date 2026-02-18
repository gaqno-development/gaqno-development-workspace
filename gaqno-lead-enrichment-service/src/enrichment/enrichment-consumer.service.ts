import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { KafkaConsumer, type KafkaProducer } from "@gaqno-development/backcore";
import { PipedriveApiService } from "../pipedrive/pipedrive-api.service";
import { TopicNames } from "../common/topics";
import type { LeadEnrichedEvent, MessageReceivedEvent } from "../common/types";

export const KAFKA_PRODUCER = "KAFKA_PRODUCER";

export interface KafkaMessagePayload {
  topic: string;
  key: string | null;
  value: string;
  headers: Record<string, string>;
}

@Injectable()
export class EnrichmentConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EnrichmentConsumerService.name);

  constructor(
    private readonly pipedriveApiService: PipedriveApiService,
    @Inject(KAFKA_PRODUCER) private readonly kafkaProducer: KafkaProducer,
    private readonly kafkaConsumer: KafkaConsumer
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaConsumer.connect();
    await this.kafkaConsumer.subscribe(
      TopicNames.MESSAGE_RECEIVED,
      (payload) => this.handleMessageReceived(payload)
    );
    this.logger.log(
      `Subscribed to ${TopicNames.MESSAGE_RECEIVED} for lead enrichment`
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaConsumer.disconnect();
  }

  async handleMessageReceived(msg: KafkaMessagePayload): Promise<void> {
    let payload: MessageReceivedEvent;
    try {
      payload = JSON.parse(msg.value) as MessageReceivedEvent;
    } catch {
      this.logger.warn("Invalid message value, skipping");
      return;
    }

    const { tenantId, waId, conversationId } = payload;

    try {
      const result = await this.pipedriveApiService.searchPersonByPhone(
        tenantId,
        waId
      );
      const person = result.data.items[0] ?? null;
      const leadEnriched: LeadEnrichedEvent = {
        tenantId,
        conversationId,
        waId,
        person,
        occurredAt: new Date().toISOString(),
      };
      await this.kafkaProducer.publishRaw(
        TopicNames.LEAD_ENRICHED,
        tenantId,
        JSON.stringify(leadEnriched)
      );
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        this.logger.warn(
          `Pipedrive rate limit (429) for tenant ${tenantId}, conversation ${conversationId}; message will be retried`
        );
        throw err;
      }
      throw err;
    }
  }
}
