import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KafkaConsumer, TopicRegistry } from "@gaqno-development/backcore";

@Global()
@Module({
  providers: [
    {
      provide: TopicRegistry,
      useValue: new TopicRegistry(),
    },
    {
      provide: KafkaConsumer,
      useFactory: (config: ConfigService, topics: TopicRegistry) => {
        const brokers = (config.get<string>("KAFKA_BROKERS") ?? "localhost:9092")
          .split(",")
          .map((s) => s.trim());
        return new KafkaConsumer({
          brokers,
          clientId: "gaqno-event-bridge",
          groupId: "gaqno-event-bridge-group",
          topics,
        });
      },
      inject: [ConfigService, TopicRegistry],
    },
  ],
  exports: [KafkaConsumer, TopicRegistry],
})
export class KafkaModule {}
