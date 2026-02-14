CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  org_id text NOT NULL,
  version int NOT NULL,
  event_type text NOT NULL,
  payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS events_aggregate_version_unique ON events (aggregate_id, version);
CREATE INDEX IF NOT EXISTS events_org_aggregate_created_idx ON events (org_id, aggregate_type, created_at);
CREATE INDEX IF NOT EXISTS events_aggregate_version_idx ON events (aggregate_id, version);
