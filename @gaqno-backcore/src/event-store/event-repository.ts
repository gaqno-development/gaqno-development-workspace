import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type PgDb = NodePgDatabase<any>;
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { DomainEvent } from '../domain/domain-event';
import type { EncryptionService } from '../encryption/encryption.service';
import { eventsTable, type EventRow } from './event-schema';

export interface AppendEventInput {
  aggregateId: string;
  aggregateType: string;
  orgId: string;
  eventType: string;
  version: number;
  payload: unknown;
}

export interface StoredEvent extends DomainEvent {
  eventId: string;
  aggregateId: string;
  orgId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  payload: unknown;
  occurredAt: string;
}

export class EventRepository {
  constructor(
    private readonly db: PgDb,
    private readonly encryption: EncryptionService,
  ) {}

  async append(input: AppendEventInput): Promise<StoredEvent> {
    return this.appendWithTx(this.db, input);
  }

  async appendWithTx(
    tx: PgDb,
    input: AppendEventInput,
  ): Promise<StoredEvent> {
    const eventId = randomUUID();
    const occurredAt = new Date().toISOString();
    const cipher = this.encryption.encrypt(input.payload, input.orgId);

    await tx.insert(eventsTable).values({
      id: eventId,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      orgId: input.orgId,
      version: input.version,
      eventType: input.eventType,
      payload: cipher,
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

  async loadByAggregate(aggregateId: string, orgId: string): Promise<StoredEvent[]> {
    const rows = await this.db
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.aggregateId, aggregateId), eq(eventsTable.orgId, orgId)))
      .orderBy(asc(eventsTable.version));
    return this.decryptRows(rows);
  }

  async getByOrg(
    orgId: string,
    options: { aggregateType?: string; limit?: number } = {},
  ): Promise<StoredEvent[]> {
    const conditions = [eq(eventsTable.orgId, orgId)];
    if (options.aggregateType) {
      conditions.push(eq(eventsTable.aggregateType, options.aggregateType));
    }
    let query = this.db
      .select()
      .from(eventsTable)
      .where(and(...conditions))
      .orderBy(asc(eventsTable.createdAt));
    if (options.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    const rows = await query;
    return this.decryptRows(rows);
  }

  private decryptRows(rows: EventRow[]): StoredEvent[] {
    return rows.map((row) => {
      const payload = this.encryption.decrypt(row.payload, row.orgId) as unknown;
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
