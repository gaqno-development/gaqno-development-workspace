import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@gaqno-ai-platform/kafka';
import { AiProcessorModule } from './ai-processor/ai-processor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }) as never,
    KafkaModule,
    AiProcessorModule,
  ],
})
export class AppModule {}
