export interface CampaignRecord {
  id: string;
  tenantId: string;
  name: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface AttributionReport {
  campaignId: string;
  startAt: string;
  endAt: string;
  gmv: number;
  transactionCount: number;
  confidence: number;
  confidenceExplanation: string;
  source: string;
  sourceAvailable: boolean;
}
