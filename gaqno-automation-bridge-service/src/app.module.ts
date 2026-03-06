import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { KafkaModule } from "./kafka/kafka.module";
import { BridgeModule } from "./bridge/bridge.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }) as never,
    KafkaModule,
    BridgeModule,
    HealthModule,
  ],
})
export class AppModule {}
