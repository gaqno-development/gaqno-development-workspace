import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const aiTaskProjectionTable = pgTable(
  'ai_task_projection',
  {
    taskId: uuid('task_id').primaryKey(),
    orgId: text('org_id').notNull(),
    state: text('state').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ orgIdx: index('ai_task_projection_org_idx').on(t.orgId) }),
);

export const organizationBalanceProjectionTable = pgTable(
  'organization_balance_projection',
  {
    orgId: text('org_id').primaryKey(),
    available: integer('available').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    consumed: integer('consumed').notNull().default(0),
    refunded: integer('refunded').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
);
