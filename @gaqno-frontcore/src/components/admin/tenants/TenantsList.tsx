import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { AdminListCard, AdminTable, AdminTableColumn } from "../AdminTable";
import { useTenants } from "../../../hooks/admin/useTenants";
import { Building2, Plus, Pencil, DollarSign } from "lucide-react";
import { ITenant } from "../../../types/admin";

interface TenantsListProps {
  basePath?: string;
}

const basePathDefault = "/admin/tenants";

export const TenantsList: React.FC<TenantsListProps> = ({
  basePath = basePathDefault,
}) => {
  const { tenants, isLoading } = useTenants();
  const list = tenants ?? [];

  const columns: AdminTableColumn<ITenant>[] = [
    {
      key: "name",
      header: "Name",
      render: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Badge variant={t.status === "active" ? "default" : "secondary"}>
          {t.status}
        </Badge>
      ),
    },
    {
      key: "users",
      header: "Users",
      render: (t) => (
        <span className="text-muted-foreground">
          {t.user_count ?? 0} / {t.max_users ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) => (
        <span className="space-x-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={`${basePath}/${t.id}/edit`}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`${basePath}/${t.id}/costs`}>
              <DollarSign className="h-4 w-4 mr-1" />
              Costs
            </Link>
          </Button>
        </span>
      ),
    },
  ];

  return (
    <AdminListCard
      title="Tenants"
      description="Manage tenants and view costs"
      icon={<Building2 className="h-5 w-5" />}
      headerActions={
        <Button asChild variant="default" size="sm">
          <Link to={`${basePath}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add tenant
          </Link>
        </Button>
      }
      isLoading={isLoading}
      loadingMessage="Loading tenants…"
      emptyMessage="No tenants yet."
      itemCount={list.length}
    >
      <AdminTable columns={columns} data={list} getRowKey={(t) => t.id} />
    </AdminListCard>
  );
};
