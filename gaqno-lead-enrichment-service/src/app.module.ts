import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/db.module";
import { EnrichmentModule } from "./enrichment/enrichment.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    HealthModule,
    EnrichmentModule,
  ],
})
export class AppModule {}
