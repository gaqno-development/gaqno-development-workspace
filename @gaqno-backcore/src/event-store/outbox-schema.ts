import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const outboxTable = pgTable(
  'outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    topic: text('topic').notNull(),
    messageKey: text('message_key').notNull(),
    messageValue: text('message_value').notNull(),
    orgId: text('org_id').notNull(),
    eventId: text('event_id').notNull(),
    correlationId: text('correlation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (t) => ({
    unpublishedIdx: index('outbox_unpublished_idx').on(t.publishedAt, t.createdAt),
  }),
);

export type OutboxRow = typeof outboxTable.$inferSelect;
export type OutboxRowInsert = typeof outboxTable.$inferInsert;
