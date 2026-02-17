export const DASHBOARD_TIME_RANGES = ["7d", "30d", "90d", "12m"] as const;
export type DashboardTimeRange = (typeof DASHBOARD_TIME_RANGES)[number];

export type TrendDirection = "up" | "down" | "neutral";

export type ActivityEventType = "deploy" | "alert" | "scale" | "security" | "config" | "user";

export type ActivityEventStatus = "success" | "warning" | "info" | "error";

export interface IDashboardOverviewCard {
  key: string;
  title: string;
  value: string;
  numericValue: number;
  change: string;
  changePercent: number;
  trend: TrendDirection;
  description: string;
}

export interface IDashboardOverviewResponse {
  cards: IDashboardOverviewCard[];
  lastUpdated: string;
}

export interface IDashboardTimeSeriesPoint {
  date: string;
  apiCalls: number;
  storage: number;
  bandwidth: number;
}

export interface IDashboardTimeSeriesResponse {
  range: DashboardTimeRange;
  points: IDashboardTimeSeriesPoint[];
  lastUpdated: string;
}

export interface IDashboardActivityEvent {
  id: string;
  type: ActivityEventType;
  service: string;
  message: string;
  status: ActivityEventStatus;
  createdAt: string;
}

export interface IDashboardActivityResponse {
  events: IDashboardActivityEvent[];
  total: number;
}
