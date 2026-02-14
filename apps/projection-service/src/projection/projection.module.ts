import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EncryptionService } from '@gaqno-ai-platform/encryption';
import { ProjectionConsumer } from './projection.consumer';
import { ProjectionGateway } from './projection.gateway';

@Module({
  imports: [ConfigModule],
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
    ProjectionConsumer,
    ProjectionGateway,
  ],
})
export class ProjectionModule {}
