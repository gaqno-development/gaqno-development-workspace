import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { AdminListCard, AdminTable, AdminTableColumn } from "../AdminTable";
import { useDomains } from "../../../hooks/admin/useDomains";
import { SSL_STATUS_LABEL } from "../constants";
import { Globe, Plus, Pencil, Shield } from "lucide-react";
import { IDomain } from "../../../types/admin";

interface DomainsListProps {
  basePath?: string;
}

const basePathDefault = "/sass/domains";

export const DomainsList: React.FC<DomainsListProps> = ({
  basePath = basePathDefault,
}) => {
  const { domains, isLoading } = useDomains();

  const columns: AdminTableColumn<IDomain>[] = [
    {
      key: "domain",
      header: "Domain",
      render: (d) => <span className="font-medium">{d.domain}</span>,
    },
    {
      key: "tenant",
      header: "Tenant",
      render: (d) => (
        <span className="text-muted-foreground">{d.tenantId}</span>
      ),
    },
    {
      key: "ssl",
      header: "SSL",
      render: (d) => (
        <Badge variant="secondary">
          {SSL_STATUS_LABEL[d.sslCertificateStatus ?? "none"] ?? "—"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) =>
        d.isActive ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) => (
        <Button asChild variant="ghost" size="sm">
          <Link to={`${basePath}/${d.id}/edit`}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <AdminListCard
      title="Domains"
      description="Manage tenant domains and SSL"
      icon={<Globe className="h-5 w-5" />}
      headerActions={
        <>
          <Button asChild variant="default" size="sm">
            <Link to={`${basePath}/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Add domain
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="ml-2">
            <Link to={`${basePath}/ssl`}>
              <Shield className="h-4 w-4 mr-2" />
              SSL status
            </Link>
          </Button>
        </>
      }
      isLoading={isLoading}
      loadingMessage="Loading domains…"
      emptyMessage="No domains yet."
      itemCount={domains.length}
    >
      <AdminTable columns={columns} data={domains} getRowKey={(d) => d.id} />
    </AdminListCard>
  );
};
