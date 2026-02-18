import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const pipedriveIntegrations = pgTable("lead_pipedrive_integrations", {
  tenantId: uuid("tenant_id").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  apiDomain: varchar("api_domain", { length: 255 }).notNull(),
});
