import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { AdminListCard, AdminTable, AdminTableColumn } from "./AdminTable";
import { useUsers, type IUserListItem } from "../../hooks/admin/useUsers";
import { useTenants } from "../../hooks/admin/useTenants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { User, Plus } from "lucide-react";

interface UsersListProps {
  basePath?: string;
  showTenantFilter?: boolean;
  showCreateButton?: boolean;
}

const basePathDefault = "/sass/users";

export const UsersList: React.FC<UsersListProps> = ({
  basePath = basePathDefault,
  showTenantFilter = false,
  showCreateButton = false,
}) => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const { users, isLoading } = useUsers(tenantId ?? undefined);
  const { tenants } = useTenants();
  const tenantList = tenants ?? [];

  const columns: AdminTableColumn<IUserListItem>[] = [
    {
      key: "email",
      header: "Email",
      render: (u) => <span className="font-medium">{u.email ?? "—"}</span>,
    },
    {
      key: "name",
      header: "Name",
      render: (u) => [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
    },
    {
      key: "tenant",
      header: "Tenant",
      render: (u) => (
        <span className="text-muted-foreground">{u.tenantId ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => (
        <Button asChild variant="ghost" size="sm">
          <Link to={`${basePath}/${u.id}/edit`}>Edit</Link>
        </Button>
      ),
    },
  ];

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      {showTenantFilter && (
        <Select
          value={tenantId ?? "all"}
          onValueChange={(v) => setTenantId(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All tenants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tenants</SelectItem>
            {tenantList.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showCreateButton && (
        <Button asChild variant="default" size="sm">
          <Link to={`${basePath}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add user
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <AdminListCard
      title="Users"
      description="Manage platform users"
      icon={<User className="h-5 w-5" />}
      headerActions={headerActions}
      isLoading={isLoading}
      loadingMessage="Loading users…"
      emptyMessage="No users found."
      itemCount={users.length}
    >
      <AdminTable columns={columns} data={users} getRowKey={(u) => u.id} />
    </AdminListCard>
  );
};
