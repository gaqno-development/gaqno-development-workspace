import React from "react";
import { TenantCostsSummary } from "./tenants/TenantCostsSummary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useAuth } from "../../hooks";
import { DollarSign } from "lucide-react";

interface CostingViewProps {
  tenantId?: string;
}

export const CostingView: React.FC<CostingViewProps> = ({
  tenantId: tenantIdProp,
}) => {
  const { user } = useAuth();
  const tenantId = tenantIdProp ?? user?.tenantId ?? "";

  if (!tenantId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Custos
          </CardTitle>
          <CardDescription>
            Associe-se a um tenant para ver custos.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  return <TenantCostsSummary tenantId={tenantId} />;
};
