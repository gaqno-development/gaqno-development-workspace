import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, isNull, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { outboxTable, type OutboxRow } from './outbox-schema';

type PgDb = NodePgDatabase<any>;

export interface OutboxEntryInsert {
  topic: string;
  messageKey: string;
  messageValue: string;
  orgId: string;
  eventId: string;
  correlationId?: string;
}

export interface OutboxEntry extends OutboxEntryInsert {
  id: string;
  createdAt: Date;
  publishedAt: Date | null;
}

export class OutboxRepository {
  constructor(private readonly db: PgDb) {}

  async insert(
    tx: PgDb,
    entry: OutboxEntryInsert,
  ): Promise<OutboxEntry> {
    const id = randomUUID();
    await tx.insert(outboxTable).values({
      id,
      topic: entry.topic,
      messageKey: entry.messageKey,
      messageValue: entry.messageValue,
      orgId: entry.orgId,
      eventId: entry.eventId,
      correlationId: entry.correlationId ?? null,
    });
    return {
      ...entry,
      id,
      createdAt: new Date(),
      publishedAt: null,
    };
  }

  async getUnpublished(limit: number): Promise<OutboxRow[]> {
    const rows = await this.db
      .select()
      .from(outboxTable)
      .where(isNull(outboxTable.publishedAt))
      .orderBy(asc(outboxTable.createdAt))
      .limit(limit);
    return rows;
  }

  async markPublished(id: string): Promise<void> {
    await this.db
      .update(outboxTable)
      .set({ publishedAt: new Date() })
      .where(eq(outboxTable.id, id));
  }
}
