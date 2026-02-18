import React, { useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import { useAuth } from "../../hooks";
import type { ColumnDef } from "../ui/data-table";
import { useTenantUsage } from "../../hooks/admin/useTenantUsage";
import { useUsers } from "../../hooks/admin/useUsers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "../ui";

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const name = d.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    options.push({ value: `${y}-${m}`, label: name });
  }
  return options;
}

function defaultPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function userDisplayName(u: {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email || u.id;
}

export interface UsageByUserViewProps {
  tenantId?: string;
  title?: string;
  subtitle?: string;
  noTenantTitle?: string;
  noTenantDescription?: string;
  cardTitle?: string;
  cardDescription?: string;
  emptyMessage?: string;
}

export function UsageByUserView({
  tenantId: tenantIdProp,
  title = "Uso por usuário",
  subtitle = "Consumo e métricas atribuídas por usuário no tenant",
  noTenantTitle = "Uso por usuário",
  noTenantDescription = "Seu usuário não está associado a um tenant. Entre em contato com o administrador para visualizar o consumo.",
  cardTitle = "Consumo por usuário",
  cardDescription = "Uso por serviço (IA, Omnichannel, etc.) no período selecionado",
  emptyMessage = "Nenhum uso registrado neste período. O consumo de IA (tokens) e outras ações é atribuído ao usuário ao usar os apps.",
}: UsageByUserViewProps) {
  const { user } = useAuth();
  const tenantId = tenantIdProp ?? user?.tenantId ?? "";
  const [period, setPeriod] = useState(defaultPeriod());
  const {
    usage,
    isLoading,
    period: effectivePeriod,
  } = useTenantUsage(tenantId, period);
  const { users } = useUsers(tenantId || undefined, undefined);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const userDisplayMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of users) {
      map[u.id] = userDisplayName(u);
    }
    return map;
  }, [users]);

  const { rows, columns, renderRowHoverContent } = useMemo(() => {
    if (!usage?.metrics?.length)
      return {
        rows: [] as Record<string, number | string>[],
        columns: [] as ColumnDef<Record<string, number | string>, unknown>[],
        renderRowHoverContent: undefined as
          | ((row: Record<string, number | string>) => React.ReactNode)
          | undefined,
      };
    const metricCols = usage.metrics
      .filter((m) => m.byUser != null)
      .map((m) => ({
        key: `${m.serviceName}-${m.metricKey}`,
        serviceName: m.serviceName,
        unit: m.unit,
      }));
    const userIdSet = new Set<string>();
    for (const m of usage.metrics) {
      if (m.byUser) {
        Object.keys(m.byUser).forEach((id) => userIdSet.add(id));
      }
    }
    const userIds = Array.from(userIdSet).sort();
    const dataRows = userIds.map((userId) => {
      const record: Record<string, number | string> = { userId };
      for (const m of usage.metrics) {
        if (m.byUser && m.byUser[userId] != null) {
          record[`${m.serviceName}-${m.metricKey}`] = m.byUser[userId];
        }
      }
      return record;
    });
    const columnDefs: ColumnDef<Record<string, number | string>, unknown>[] = [
      {
        id: "userId",
        header: "Usuário",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.userId === user?.id ? (
              <span>Você ({user?.email ?? row.original.userId})</span>
            ) : (
              (userDisplayMap[row.original.userId as string] ??
              String(row.original.userId))
            )}
          </span>
        ),
      },
      ...metricCols.map((col) => ({
        id: col.key,
        header: `${col.serviceName === "ai" ? "IA (tokens)" : col.serviceName} (${col.unit})`,
        cell: ({
          row,
        }: {
          row: { original: Record<string, number | string> };
        }) =>
          typeof row.original[col.key] === "number"
            ? Number(row.original[col.key]).toLocaleString("pt-BR")
            : "—",
      })),
    ];
    const hoverContent = (row: Record<string, number | string>) => {
      const displayName =
        row.userId === user?.id
          ? `Você (${user?.email ?? row.userId})`
          : (userDisplayMap[row.userId as string] ?? String(row.userId));
      const items = usage.metrics.filter(
        (m) => m.byUser && m.byUser[row.userId as string] != null
      );
      return (
        <div className="space-y-2 p-1">
          <p className="font-medium text-sm">{displayName}</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {items.map((m) => (
              <li key={`${m.serviceName}-${m.metricKey}`}>
                {m.serviceName === "ai" ? "IA (tokens)" : m.serviceName} (
                {m.unit}):{" "}
                {Number(m.byUser![row.userId as string]).toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
        </div>
      );
    };
    return {
      rows: dataRows,
      columns: columnDefs,
      renderRowHoverContent: hoverContent,
    };
  }, [usage, user?.id, user?.email, userDisplayMap]);

  if (!tenantId) {
    return (
      <div className="container mx-auto py-6 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PieChart className="h-8 w-8" />
            {noTenantTitle}
          </h1>
          <p className="text-muted-foreground mt-1">{noTenantDescription}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>{noTenantDescription}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <PieChart className="h-8 w-8" />
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{cardTitle}</CardTitle>
              <CardDescription>{cardDescription}</CardDescription>
            </div>
            <Select value={effectivePeriod} onValueChange={setPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <DataTable<Record<string, number | string>, unknown>
              columns={columns}
              data={rows}
              getRowId={(row) => String(row.userId)}
              enableSorting={false}
              enableFiltering={false}
              enableVisibility={false}
              showPagination={rows.length > 10}
              emptyMessage={emptyMessage}
              renderRowHoverContent={renderRowHoverContent}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
