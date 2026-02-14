import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { KafkaModule } from '@gaqno-ai-platform/kafka';
import { ProjectionModule } from './projection/projection.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }) as never,
    DatabaseModule,
    KafkaModule,
    ProjectionModule,
  ],
})
export class AppModule {}
