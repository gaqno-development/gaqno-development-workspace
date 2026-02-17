"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Input,
} from "../ui";
import {
  useCampaigns,
  useAttributionReport,
  useCreateCampaign,
} from "../../hooks/ai";

const DEFAULT_TENANT_ID = "00000000-0000-4000-a000-000000000000";

export interface AIAttributionDashboardProps {
  tenantId?: string;
  campaignId?: string | null;
  compact?: boolean;
  title?: string;
}

export function AIAttributionDashboard({
  tenantId: initialTenantId = DEFAULT_TENANT_ID,
  campaignId: initialCampaignId,
  compact = false,
  title = "GMV attribution & tracking",
}: AIAttributionDashboardProps) {
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    initialCampaignId ?? null
  );

  const campaignsQuery = useCampaigns(tenantId);
  const reportQuery = useAttributionReport(selectedCampaignId ?? "", tenantId);
  const createCampaign = useCreateCampaign();

  const handleCreate = useCallback(() => {
    if (!name.trim() || !startAt || !endAt) return;
    createCampaign.mutate(
      {
        tenantId: tenantId || undefined,
        name: name.trim(),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      },
      {
        onSuccess: () => {
          setName("");
          setStartAt("");
          setEndAt("");
        },
      }
    );
  }, [name, startAt, endAt, tenantId, createCampaign]);

  const canCreate =
    name.trim().length > 0 &&
    startAt.length > 0 &&
    endAt.length > 0 &&
    !createCampaign.isPending;

  const campaigns = campaignsQuery.data ?? [];
  const report = reportQuery.data;

  if (compact) {
    return (
      <div className="space-y-2">
        <Input
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          placeholder="Tenant ID"
          className="max-w-md font-mono text-xs"
        />
        <p className="text-sm text-muted-foreground">
          {campaigns.length} campaign(s)
        </p>
        {selectedCampaignId && report && (
          <p className="text-xs">
            GMV: {report.gmv.toLocaleString()} · Confidence:{" "}
            {(report.confidence * 100).toFixed(0)}%
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Campaign-based attribution. PDV as source of truth for GMV.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Tenant ID</Label>
          <Input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder={DEFAULT_TENANT_ID}
            className="max-w-md font-mono text-xs"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Campaign name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Black Friday 2025"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Start (ISO)</Label>
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">End (ISO)</Label>
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
        </div>
        <Button size="sm" onClick={handleCreate} disabled={!canCreate}>
          {createCampaign.isPending ? "Creating…" : "Create campaign"}
        </Button>
        {createCampaign.isError && (
          <p className="text-sm text-destructive">
            {(createCampaign.error as Error)?.message ?? "Create failed."}
          </p>
        )}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Campaigns</Label>
          {campaignsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {!campaignsQuery.isLoading && campaigns.length === 0 && (
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          )}
          {campaigns.length > 0 && (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">
                    {new Date(c.startAt).toLocaleDateString()} –{" "}
                    {new Date(c.endAt).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedCampaignId(
                        selectedCampaignId === c.id ? null : c.id
                      )
                    }
                  >
                    {selectedCampaignId === c.id
                      ? "Hide report"
                      : "View report"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedCampaignId && (
          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-xs font-medium">Attribution report</Label>
            {reportQuery.isLoading && !report && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {report && (
              <div className="space-y-2 text-sm">
                {report.sourceAvailable === false && (
                  <p className="text-amber-600 dark:text-amber-500 text-xs font-medium">
                    Source temporarily unavailable.
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">GMV: </span>
                    <strong>{report.gmv.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Transactions:{" "}
                    </span>
                    <strong>{report.transactionCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence: </span>
                    <strong>{(report.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source: </span>
                    <strong>{report.source}</strong>
                  </div>
                </div>
                {report.confidenceExplanation && (
                  <p className="text-muted-foreground">
                    {report.confidenceExplanation}
                  </p>
                )}
              </div>
            )}
            {reportQuery.isError && (
              <p className="text-sm text-destructive">
                {(reportQuery.error as Error)?.message ?? "Report failed."}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
