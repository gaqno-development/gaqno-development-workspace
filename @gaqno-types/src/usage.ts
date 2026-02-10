export const USAGE_METRIC_UNITS = [
  "tokens",
  "requests",
  "storage_mb",
  "minutes",
  "count",
] as const;

export type UsageMetricUnit = (typeof USAGE_METRIC_UNITS)[number];

export interface IUsageMetricRecord {
  id: string;
  serviceName: string;
  metricKey: string;
  quantity: number;
  unit: UsageMetricUnit;
  tenantId: string | null;
  userId: string | null;
  period: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface IUsageMetricSummary {
  tenantId: string;
  period: string;
  byService: Record<string, number>;
  byUser: Record<string, number>;
  totalQuantity: number;
  unit: UsageMetricUnit;
  metricKey: string;
}

export interface ITenantUsageSummary {
  tenantId: string;
  period: string;
  metrics: Array<{
    serviceName: string;
    metricKey: string;
    quantity: number;
    unit: UsageMetricUnit;
    byUser?: Record<string, number>;
  }>;
}
