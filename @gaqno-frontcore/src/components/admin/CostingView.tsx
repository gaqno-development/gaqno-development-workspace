import React from "react";
import { TenantCostsCard } from "./tenants/TenantCostsCard";

interface CostingViewProps {
  tenantId?: string;
}

export const CostingView: React.FC<CostingViewProps> = ({ tenantId }) => {
  if (!tenantId) {
    return (
      <p className="text-muted-foreground text-sm">
        Select a tenant to view costs and usage.
      </p>
    );
  }
  return <TenantCostsCard tenantId={tenantId} />;
};
