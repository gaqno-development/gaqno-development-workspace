CREATE TABLE IF NOT EXISTS ai_task_projection (
  task_id uuid PRIMARY KEY,
  org_id text NOT NULL,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_task_projection_org_idx ON ai_task_projection (org_id);

CREATE TABLE IF NOT EXISTS organization_balance_projection (
  org_id text PRIMARY KEY,
  available int NOT NULL DEFAULT 0,
  reserved int NOT NULL DEFAULT 0,
  consumed int NOT NULL DEFAULT 0,
  refunded int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
