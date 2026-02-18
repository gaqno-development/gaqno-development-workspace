import {
  Module,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  KafkaProducer,
  KafkaConsumer,
  TopicRegistry,
} from "@gaqno-development/backcore";
import { DatabaseModule } from "../database/db.module";
import { PipedriveModule } from "../pipedrive/pipedrive.module";
import { EnrichmentConsumerService, KAFKA_PRODUCER } from "./enrichment-consumer.service";
import { TopicNames } from "../common/topics";

@Module({
  imports: [DatabaseModule, PipedriveModule],
  providers: [
    {
      provide: TopicRegistry,
      useValue: new TopicRegistry(),
    },
    {
      provide: KafkaProducer,
      useFactory: (config: ConfigService, topics: TopicRegistry) => {
        const brokers = (config.get<string>("KAFKA_BROKERS") ?? "localhost:9092")
          .split(",")
          .map((s) => s.trim());
        return new KafkaProducer({
          brokers,
          clientId: "gaqno-lead-enrichment-service",
          topics,
        });
      },
      inject: [ConfigService, TopicRegistry],
    },
    {
      provide: KAFKA_PRODUCER,
      useExisting: KafkaProducer,
    },
    {
      provide: KafkaConsumer,
      useFactory: (config: ConfigService, topics: TopicRegistry) => {
        const brokers = (config.get<string>("KAFKA_BROKERS") ?? "localhost:9092")
          .split(",")
          .map((s) => s.trim());
        return new KafkaConsumer({
          brokers,
          clientId: "gaqno-lead-enrichment-consumer",
          groupId: "gaqno-lead-enrichment",
          topics,
        });
      },
      inject: [ConfigService, TopicRegistry],
    },
    EnrichmentConsumerService,
  ],
})
export class EnrichmentModule
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EnrichmentModule.name);

  constructor(
    private readonly kafkaProducer: KafkaProducer,
    private readonly consumer: EnrichmentConsumerService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.kafkaProducer.connect();
      this.logger.log("Kafka producer connected");
    } catch (err) {
      this.logger.warn(
        `Kafka producer unavailable: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    await this.consumer.onModuleInit();
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.onModuleDestroy();
    try {
      await this.kafkaProducer.disconnect();
    } catch {
      // ignore
    }
  }
}
