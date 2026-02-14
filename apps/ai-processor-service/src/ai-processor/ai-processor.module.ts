import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EncryptionService } from '@gaqno-ai-platform/encryption';
import { AiProcessorConsumer } from './ai-processor.consumer';
import { AiProcessorEmitter } from './ai-processor.emitter';
import { XSkillModule } from '../xskill/xskill.module';

@Module({
  imports: [ConfigModule, XSkillModule],
  providers: [
    {
      provide: EncryptionService,
      useFactory: (config: ConfigService) => {
        const masterKey = config.get<string>('MASTER_KEY');
        if (!masterKey) throw new Error('MASTER_KEY required');
        return new EncryptionService(masterKey);
      },
      inject: [ConfigService],
    },
    AiProcessorConsumer,
    AiProcessorEmitter,
  ],
})
export class AiProcessorModule {}
