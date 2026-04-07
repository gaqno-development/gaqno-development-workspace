import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useTenantCosts } from "@gaqno-development/frontcore/hooks/admin/useTenantCosts";
import type { ITenantCosts } from "@gaqno-development/frontcore/types/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableColumnHeader,
  Button,
  Skeleton,
  Alert,
  AlertDescription,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Badge,
  Input,
} from "@gaqno-development/frontcore/components/ui";
import {
  RefreshCw,
  DollarSign,
  AlertCircle,
  Download,
  FileText,
  FileSpreadsheet,
  Code,
  Wifi,
  WifiOff,
  Search,
  Filter,
  BarChart3,
} from "lucide-react";
import {
  exportToCSV,
  exportToJSON,
  exportToPDF,
  type ExportData,
} from "../utils/exportUtils";
import { DateRangePicker } from "./DateRangePicker";
import { useRealTimeCosts } from "../hooks/useRealTimeCosts";
import { CostTrendsChart } from "./CostTrendsChart";
import { BudgetAlerts } from "./BudgetAlerts";
import { DashboardOverview } from "./DashboardOverview/DashboardOverview";
import { AdvancedFilters } from "./AdvancedFilters/AdvancedFilters";
import { CostBreakdownChart } from "./CostBreakdownChart/CostBreakdownChart";
import { RealTimeMonitor } from "./RealTimeMonitor";

const columns: ColumnDef<ITenantCosts>[] = [
  {
    accessorKey: "provider",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Provider" />
    ),
  },
  {
    accessorKey: "serviceName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service" />
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => (
      <span className="capitalize">{row.original.category}</span>
    ),
  },
  {
    accessorKey: "costAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const cost = row.original;
      return (
        <span className="text-right tabular-nums">
          {cost.currency}{" "}
          {cost.costAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    },
  },
];

interface TenantCostsSummaryProps {
  tenantId: string;
}

export function TenantCostsSummary({ tenantId }: TenantCostsSummaryProps) {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<
    "overview" | "details" | "charts" | "monitor"
  >("overview");

  const { costs, summary, isLoading, isError, error, syncCosts, refetch } =
    useTenantCosts(tenantId);

  const {
    isConnected,
    lastUpdate,
    error: wsError,
  } = useRealTimeCosts({
    tenantId,
    enabled: !!tenantId,
    onCostUpdate: (update) => {
      // Refresh data when real-time update received
      refetch();
    },
  });

  const handleExport = (format: "csv" | "json" | "pdf") => {
    if (!summary || !costs) return;

    const exportData: ExportData = {
      costs,
      summary,
      metadata: {
        exportDate: new Date().toISOString(),
        dateRange,
        tenantId,
      },
    };

    switch (format) {
      case "csv":
        exportToCSV(exportData);
        break;
      case "json":
        exportToJSON(exportData);
        break;
      case "pdf":
        exportToPDF(exportData);
        break;
    }
  };

  // Filter costs based on search term
  const filteredCosts = costs.filter(
    (cost) =>
      cost.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cost.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cost.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    const message =
      error instanceof Error
        ? error.message
        : ((error as unknown as { message?: string })?.message ??
          "Falha ao carregar custos");
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Summary
          </CardTitle>
          <CardDescription>Detailed breakdown of tenant costs</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{message}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            variant={activeView === "overview" ? "default" : "outline"}
            onClick={() => setActiveView("overview")}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Overview
          </Button>
          <Button
            variant={activeView === "details" ? "default" : "outline"}
            onClick={() => setActiveView("details")}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Details
          </Button>
          <Button
            variant={activeView === "charts" ? "default" : "outline"}
            onClick={() => setActiveView("charts")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Charts
          </Button>
          <Button
            variant={activeView === "monitor" ? "default" : "outline"}
            onClick={() => setActiveView("monitor")}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Monitor
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 ml-auto">
          <div className="relative">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <AdvancedFilters
          filters={{
            categories: [],
            providers: [],
            status: "all",
            minCost: 0,
            maxCost: Infinity,
            dateRange: { from: "", to: "" },
          }}
          onFiltersChange={() => {}}
          onApply={() => setShowFilters(false)}
          onClear={() => setShowFilters(false)}
          availableCategories={["image", "video", "audio", "text", "api"]}
          availableProviders={["nexai", "openai", "anthropic"]}
        />
      )}

      {/* Content based on active view */}
      {activeView === "overview" && summary && (
        <DashboardOverview
          totalCost={summary.totalMonthlyCost}
          previousCost={summary.totalMonthlyCost * 0.9} // Mock previous cost
          activeCosts={summary.activeCostsCount}
          totalAlerts={3} // Mock alert count
          currency={summary.currency}
          isLoading={isLoading}
        />
      )}

      {activeView === "details" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Details
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of tenant costs
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("json")}>
                      <Code className="h-4 w-4 mr-2" />
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => syncCosts()}>
                  <RefreshCw className="h-4 w-4" />
                  Sync
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {summary && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Monthly Cost
                      </div>
                      <div className="text-2xl font-bold">
                        {summary.currency}{" "}
                        {summary.totalMonthlyCost.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Active Costs
                      </div>
                      <div className="text-2xl font-bold">
                        {summary.activeCostsCount}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                    <div className="w-full sm:w-64">
                      <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder="Select date range"
                      />
                    </div>
                    <Badge
                      variant={isConnected ? "default" : "destructive"}
                      className="flex items-center gap-1"
                    >
                      {isConnected ? (
                        <>
                          <Wifi className="h-3 w-3" />
                          Live
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3" />
                          Offline
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {lastUpdate && (
                  <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
                    Last update:{" "}
                    {new Date(lastUpdate.timestamp).toLocaleString()} -
                    {lastUpdate.provider} ({lastUpdate.category}):{" "}
                    {lastUpdate.currency} {lastUpdate.costAmount.toFixed(2)}
                  </div>
                )}

                {filteredCosts.length > 0 ? (
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Cost Details ({filteredCosts.length} of {costs.length})
                    </div>
                    <DataTable
                      columns={columns}
                      data={filteredCosts}
                      getRowId={(row) => row.id}
                      showPagination={false}
                    />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No costs found for this tenant
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeView === "charts" && (
        <CostBreakdownChart
          data={costs.map((cost) => ({
            id: cost.id,
            provider: cost.provider,
            serviceName: cost.serviceName,
            category: cost.category,
            costAmount: cost.costAmount,
            currency: cost.currency,
            date: cost.startDate,
          }))}
          isLoading={isLoading}
        />
      )}

      {activeView === "monitor" && <RealTimeMonitor tenantId={tenantId} />}

      {/* Existing Features */}
      {summary && activeView === "details" && (
        <div className="space-y-6 mt-6">
          <CostTrendsChart
            data={costs.map((cost) => ({
              date: new Date().toISOString().split("T")[0], // Simplified
              amount: cost.costAmount,
              category: cost.category,
            }))}
            isLoading={isLoading}
          />

          <BudgetAlerts
            tenantId={tenantId}
            currentSpend={summary.totalMonthlyCost}
            currency={summary.currency}
          />
        </div>
      )}
    </div>
  );
}
