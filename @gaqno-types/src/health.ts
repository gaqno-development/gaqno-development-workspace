export type HealthEventSource = "CI" | "AGENT" | "RELEASE" | "PROD";

export type HealthEventType =
  | "PIPELINE_FAILED"
  | "SELF_HEAL_TRIGGERED"
  | "PR_CREATED"
  | "PR_MERGED"
  | "ESCALATED"
  | "RELEASE_RESUMED";

export type HealthEventSeverity = "low" | "medium" | "high";

export interface HealthEvent {
  id: string;
  timestamp: string;
  source: HealthEventSource;
  type: HealthEventType;
  severity: HealthEventSeverity;
  confidence?: number;
  metadata: Record<string, unknown>;
}

export interface HealthSummary {
  health_score: number;
  total_events_24h: number;
  failures_24h: number;
  self_heals_24h: number;
  agents_active: number;
  last_updated: string;
}

export interface FailureByType {
  type: HealthEventType;
  count: number;
  last_occurrence: string;
}

export interface AgentStats {
  name: string;
  runs_24h: number;
  success_rate: number;
  avg_confidence: number;
}

export interface ReleaseInfo {
  id: string;
  version: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
}
