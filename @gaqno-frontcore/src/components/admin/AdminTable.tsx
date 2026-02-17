import React from "react";
import type { ColumnDef } from "../ui/data-table";
import { DataTable } from "../ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export type AdminTableView = "full" | "simple";

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  view?: AdminTableView;
}

function toColumnDef<T>(col: AdminTableColumn<T>): ColumnDef<T, unknown> {
  return {
    id: col.key,
    header: col.header,
    cell: ({ row }) => (
      <div className={col.align === "right" ? "text-right" : undefined}>
        {col.render(row.original)}
      </div>
    ),
  };
}

export function AdminTable<T>({
  columns,
  data,
  getRowKey,
  view = "full",
}: AdminTableProps<T>): React.ReactElement {
  const columnDefs: ColumnDef<T, unknown>[] = columns.map(toColumnDef);
  const isSimple = view === "simple";

  return (
    <DataTable<T, unknown>
      columns={columnDefs}
      data={data}
      getRowId={(row) => getRowKey(row)}
      enableSorting={!isSimple}
      enableFiltering={!isSimple}
      enableVisibility={!isSimple}
      showPagination={!isSimple}
      initialPageSize={isSimple ? 100 : 10}
      emptyMessage="Nenhum item."
    />
  );
}

interface AdminListCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  headerActions?: React.ReactNode;
  isLoading: boolean;
  loadingMessage: string;
  emptyMessage: string;
  itemCount: number;
  children: React.ReactNode;
}

export function AdminListCard({
  title,
  description,
  icon,
  headerActions,
  isLoading,
  loadingMessage,
  emptyMessage,
  itemCount,
  children,
}: AdminListCardProps): React.ReactElement {
  const content = isLoading ? (
    <p className="text-muted-foreground text-sm">{loadingMessage}</p>
  ) : itemCount === 0 ? (
    <p className="text-muted-foreground text-sm">{emptyMessage}</p>
  ) : (
    children
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        {headerActions && <div className="pt-2">{headerActions}</div>}
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
