import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const eventsTable = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    aggregateId: text('aggregate_id').notNull(),
    aggregateType: text('aggregate_type').notNull(),
    orgId: text('org_id').notNull(),
    version: integer('version').notNull(),
    eventType: text('event_type').notNull(),
    payload: text('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgAggregateCreatedIdx: index('events_org_aggregate_created_idx').on(
      t.orgId,
      t.aggregateType,
      t.createdAt,
    ),
    aggregateVersionIdx: index('events_aggregate_version_idx').on(t.aggregateId, t.version),
    aggregateVersionUnique: uniqueIndex('events_aggregate_version_unique').on(
      t.aggregateId,
      t.version,
    ),
  }),
);

export type EventRow = typeof eventsTable.$inferSelect;
export type EventRowInsert = typeof eventsTable.$inferInsert;
