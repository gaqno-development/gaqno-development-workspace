export interface BillingSummary {
  tenantId: string;
  period: { from: string; to: string };
  gmv: number;
  transactionCount: number;
  feeRatePercent: number;
  feeAmount: number;
  currency: string;
  summaryExplanation?: string;
  sourceAvailable: boolean;
}
