import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { EventRepository } from './event-repository';
import type { EncryptionService } from '../encryption/encryption.service';

export interface PostgresEventStoreConfig<TDb = unknown> {
  db: TDb;
  encryption: EncryptionService;
}

export class PostgresEventStore extends EventRepository {
  constructor(config: PostgresEventStoreConfig) {
    super(config.db as NodePgDatabase<any>, config.encryption);
  }
}

export { EventRepository } from './event-repository';
export { eventsTable, type EventRow, type EventRowInsert } from './event-schema';
export type { AppendEventInput, StoredEvent } from './event-repository';
