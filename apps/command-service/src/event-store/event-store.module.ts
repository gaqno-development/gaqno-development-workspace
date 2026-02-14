import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EncryptionService } from '@gaqno-ai-platform/encryption';
import { EventStoreRepository } from '@gaqno-ai-platform/event-store';
import { KafkaModule } from '@gaqno-ai-platform/kafka';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [ConfigModule, KafkaModule, DatabaseModule],
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
    {
      provide: EventStoreRepository,
      useFactory: (db: NodePgDatabase, encryption: EncryptionService) => {
        return new EventStoreRepository(db, encryption);
      },
      inject: ['DB', EncryptionService],
    },
  ],
  exports: [EncryptionService, EventStoreRepository],
})
export class EventStoreModule {}
