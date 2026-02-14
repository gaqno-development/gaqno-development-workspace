import { eq, and, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import type { EncryptedPayload, EventEnvelope } from '@gaqno-ai-platform/shared-kernel';
import { EncryptionService } from '@gaqno-ai-platform/encryption';
import { eventsTable, type EventRow } from './schema';

export interface AppendEventInput {
  aggregateId: string;
  aggregateType: string;
  orgId: string;
  eventType: string;
  version: number;
  payload: unknown;
}

export interface StoredEventEnvelope extends EventEnvelope {
  eventId: string;
  aggregateId: string;
  orgId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  payload: unknown;
  occurredAt: string;
}

export interface EventStoreRepositoryConfig {
  db: NodePgDatabase;
  encryption: EncryptionService;
}

export class EventStoreRepository {
  constructor(
    private readonly db: NodePgDatabase,
    private readonly encryption: EncryptionService,
  ) {}

  async append(input: AppendEventInput): Promise<StoredEventEnvelope> {
    const eventId = randomUUID();
    const occurredAt = new Date().toISOString();
    const payloadJson = JSON.stringify(input.payload);
    const plaintext = Buffer.from(payloadJson, 'utf8');
    const encrypted = this.encryption.encrypt(plaintext, input.orgId);
    const payloadStorage = JSON.stringify(encrypted);

    await this.db.insert(eventsTable).values({
      id: eventId,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      orgId: input.orgId,
      version: input.version,
      eventType: input.eventType,
      payload: payloadStorage,
      createdAt: new Date(occurredAt),
    });

    return {
      eventId,
      aggregateId: input.aggregateId,
      orgId: input.orgId,
      aggregateType: input.aggregateType,
      eventType: input.eventType,
      version: input.version,
      payload: input.payload,
      occurredAt,
    };
  }

  async loadByAggregate(aggregateId: string): Promise<StoredEventEnvelope[]> {
    const rows = await this.db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.aggregateId, aggregateId))
      .orderBy(asc(eventsTable.version));

    return this.decryptRows(rows);
  }

  async getByOrg(
    orgId: string,
    options: { aggregateType?: string; limit?: number } = {},
  ): Promise<StoredEventEnvelope[]> {
    const conditions = [eq(eventsTable.orgId, orgId)];
    if (options.aggregateType) {
      conditions.push(eq(eventsTable.aggregateType, options.aggregateType));
    }
    const query = this.db
      .select()
      .from(eventsTable)
      .where(and(...conditions))
      .orderBy(asc(eventsTable.createdAt));
    const limited = options.limit ? query.limit(options.limit) : query;
    const rows = await limited;
    return this.decryptRows(rows);
  }

  private decryptRows(rows: EventRow[]): StoredEventEnvelope[] {
    return rows.map((row) => {
      const encrypted = JSON.parse(row.payload) as EncryptedPayload;
      const plaintext = this.encryption.decrypt(encrypted, row.orgId);
      const payload = JSON.parse(plaintext.toString('utf8')) as unknown;
      return {
        eventId: row.id,
        aggregateId: row.aggregateId,
        orgId: row.orgId,
        aggregateType: row.aggregateType,
        eventType: row.eventType,
        version: row.version,
        payload,
        occurredAt: row.createdAt.toISOString(),
      };
    });
  }
}
