import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useForm } from "react-hook-form";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { DataTablePagination } from "./data-table-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { EmptyState } from "./empty-state";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { ResponsiveSheetDrawer } from "./responsive-sheet-drawer";
import { Form } from "./form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Filter, SearchX } from "lucide-react";
import type {
  DataTableDataProp,
  DataTableSorterProps,
  OpenOnRowActionType,
  Updater,
} from "./data-table-types";

export type { ColumnDef } from "@tanstack/react-table";
export type {
  DataTableDataProp,
  DataTableSorterProps,
  OpenOnRowActionType,
  Updater,
} from "./data-table-types";

function normalizeDataProp<TData>(prop: DataTableDataProp<TData>): {
  data: TData[];
  error: Error | undefined;
  isLoading: boolean;
} {
  if (Array.isArray(prop)) {
    return { data: prop, error: undefined, isLoading: false };
  }
  return {
    data: prop.data ?? [],
    error: prop.error,
    isLoading: prop.isLoading ?? false,
  };
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: DataTableDataProp<TData>;
  initialPageSize?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableVisibility?: boolean;
  enableRowSelection?: boolean;
  showPagination?: boolean;
  renderToolbar?: (ctx: {
    table: ReturnType<typeof useReactTable<TData>>;
  }) => React.ReactNode;
  emptyMessage?: string;
  emptySearchMessage?: string;
  renderEmptyState?: React.ReactNode;
  renderEmptySearchState?: React.ReactNode;
  renderError?: (error: Error) => React.ReactNode;
  renderLoading?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
  cardStyle?: boolean;
  cardTitle?: React.ReactNode;
  cardDescription?: React.ReactNode;
  cardActions?: React.ReactNode;
  sorterProps?: DataTableSorterProps;
  filterSheetTitle?: string;
  filterSheetSide?: "left" | "right";
  renderFilterSheetContent?:
    | React.ReactNode
    | ((
        form: ReturnType<typeof useForm<Record<string, unknown>>>
      ) => React.ReactNode);
  filterFormDefaultValues?: Record<string, unknown>;
  onFilterSubmit?: (values: Record<string, unknown>) => void;
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  openOnRowActionType?: OpenOnRowActionType;
  renderRowDetail?: (row: TData) => React.ReactNode;
  renderRowHoverContent?: (row: TData) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data: dataProp,
  initialPageSize = 10,
  enableSorting = true,
  enableFiltering = true,
  enableVisibility = true,
  enableRowSelection = false,
  showPagination = true,
  renderToolbar,
  emptyMessage = "Sem resultados.",
  emptySearchMessage = "Nenhum resultado para os filtros aplicados.",
  renderEmptyState,
  renderEmptySearchState,
  renderError,
  renderLoading,
  onRowClick,
  getRowId,
  cardStyle = false,
  cardTitle,
  cardDescription,
  cardActions,
  sorterProps,
  filterSheetTitle = "Filtros",
  filterSheetSide = "right",
  renderFilterSheetContent,
  filterFormDefaultValues,
  onFilterSubmit,
  infiniteScroll = false,
  onLoadMore,
  openOnRowActionType,
  renderRowDetail,
  renderRowHoverContent,
}: DataTableProps<TData, TValue>) {
  const { data, error, isLoading } = normalizeDataProp(dataProp);
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<TData | null>(null);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const scrollSentinelRef = React.useRef<HTMLDivElement>(null);

  const filterForm = useForm<Record<string, unknown>>({
    defaultValues: filterFormDefaultValues ?? {},
  });

  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    []
  );
  const sortingState = sorterProps?.sorting ?? internalSorting;
  const setSortingRaw = sorterProps?.onSortingChange ?? setInternalSorting;
  const handleSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      setSortingRaw(
        typeof updaterOrValue === "function"
          ? updaterOrValue
          : () => updaterOrValue
      );
    },
    [setSortingRaw]
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: infiniteScroll ? undefined : getPaginationRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    onSortingChange: enableSorting ? handleSortingChange : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onColumnVisibilityChange: enableVisibility
      ? setColumnVisibility
      : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    getRowId: getRowId,
    initialState: {
      pagination: { pageSize: initialPageSize },
    },
    state: {
      sorting: sortingState,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const hasActiveFilters = table.getState().columnFilters.length > 0;
  const filteredRows = table.getRowModel().rows;
  const isEmpty = data.length === 0;
  const isEmptySearch =
    !isEmpty && hasActiveFilters && filteredRows.length === 0;

  React.useEffect(() => {
    if (!infiniteScroll || !onLoadMore) return;
    const el = scrollSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [infiniteScroll, onLoadMore]);

  const handleRowClick = React.useCallback(
    (row: TData) => {
      if (openOnRowActionType && renderRowDetail) {
        setSelectedRow(row);
        if (openOnRowActionType === "popover") setPopoverOpen(true);
      }
      onRowClick?.(row);
    },
    [openOnRowActionType, renderRowDetail, onRowClick]
  );

  const handleCloseRowDetail = React.useCallback(() => {
    setSelectedRow(null);
    setPopoverOpen(false);
  }, []);

  const handleFilterSubmit = React.useCallback(
    (values: Record<string, unknown>) => {
      onFilterSubmit?.(values);
      setFilterSheetOpen(false);
    },
    [onFilterSubmit]
  );

  if (error) {
    const errorContent = renderError ? (
      renderError(error)
    ) : (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <p className="font-medium">Erro ao carregar dados</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
    if (cardStyle) {
      return (
        <Card className="border-border bg-card text-card-foreground">
          <CardContent className="pt-6">{errorContent}</CardContent>
        </Card>
      );
    }
    return <div className="w-full">{errorContent}</div>;
  }

  if (isLoading) {
    const loadingContent = renderLoading ?? (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-full bg-muted" />
        <Skeleton className="h-64 w-full bg-muted" />
      </div>
    );
    if (cardStyle) {
      return (
        <Card className="border-border bg-card text-card-foreground">
          {cardTitle != null && (
            <CardHeader>
              <CardTitle>{cardTitle}</CardTitle>
              {cardDescription != null && (
                <CardDescription>{cardDescription}</CardDescription>
              )}
            </CardHeader>
          )}
          <CardContent>{loadingContent}</CardContent>
        </Card>
      );
    }
    return <div className="w-full">{loadingContent}</div>;
  }

  const showEmptyState = isEmpty && !hasActiveFilters;
  const showEmptySearchState = isEmptySearch;

  const tableBodyContent = () => {
    if (showEmptyState) {
      if (renderEmptyState) return renderEmptyState;
      return (
        <div className="flex min-h-[240px] items-center justify-center rounded-md border border-border bg-muted/20">
          <EmptyState
            title={emptyMessage}
            description="Não há itens para exibir."
            size="md"
          />
        </div>
      );
    }
    if (showEmptySearchState) {
      if (renderEmptySearchState) return renderEmptySearchState;
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-md border border-border bg-muted/20 p-8">
          <SearchX className="h-12 w-12 text-muted-foreground" />
          <p className="font-medium text-foreground">{emptySearchMessage}</p>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros.
          </p>
        </div>
      );
    }
    return (
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="border-border bg-muted/50 text-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => {
              const rowEl = (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={
                    onRowClick || (openOnRowActionType && renderRowDetail)
                      ? () => handleRowClick(row.original as TData)
                      : undefined
                  }
                  className={
                    onRowClick || (openOnRowActionType && renderRowDetail)
                      ? "cursor-pointer border-border hover:bg-muted/50 data-[state=selected]:bg-muted"
                      : "border-border"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="border-border text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
              if (renderRowHoverContent) {
                return (
                  <HoverCard key={row.id} openDelay={400} closeDelay={150}>
                    <HoverCardTrigger asChild>{rowEl}</HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      className="max-w-sm"
                    >
                      {renderRowHoverContent(row.original as TData)}
                    </HoverCardContent>
                  </HoverCard>
                );
              }
              return rowEl;
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const filterSheetContent =
    typeof renderFilterSheetContent === "function"
      ? renderFilterSheetContent(
          filterForm as ReturnType<typeof useForm<Record<string, unknown>>>
        )
      : renderFilterSheetContent;

  const tableContent = (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {typeof renderToolbar === "function" ? (
          <div className="flex flex-1 flex-wrap items-center gap-2 py-2">
            {renderToolbar({ table })}
            {renderFilterSheetContent != null && (
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="border-border">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side={filterSheetSide}
                  className="border-border bg-background text-foreground"
                >
                  <SheetHeader>
                    <SheetTitle className="text-foreground">
                      {filterSheetTitle}
                    </SheetTitle>
                  </SheetHeader>
                  {typeof renderFilterSheetContent === "function" ? (
                    <Form {...filterForm}>
                      <form
                        onSubmit={filterForm.handleSubmit(handleFilterSubmit)}
                        className="mt-4 space-y-4"
                      >
                        {filterSheetContent}
                        <div className="flex gap-2 pt-4">
                          <Button type="submit" size="sm">
                            Aplicar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFilterSheetOpen(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    filterSheetContent
                  )}
                </SheetContent>
              </Sheet>
            )}
          </div>
        ) : renderFilterSheetContent != null ? (
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="border-border">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent
              side={filterSheetSide}
              className="border-border bg-background text-foreground"
            >
              <SheetHeader>
                <SheetTitle className="text-foreground">
                  {filterSheetTitle}
                </SheetTitle>
              </SheetHeader>
              {filterSheetContent}
            </SheetContent>
          </Sheet>
        ) : null}
      </div>

      {tableBodyContent()}

      {!showEmptyState &&
        !showEmptySearchState &&
        showPagination &&
        !infiniteScroll &&
        filteredRows.length > 0 && <DataTablePagination table={table} />}

      {infiniteScroll &&
        onLoadMore &&
        !showEmptyState &&
        !showEmptySearchState && (
          <div ref={scrollSentinelRef} className="h-4 w-full" aria-hidden />
        )}

      {openOnRowActionType === "sheet" &&
        selectedRow != null &&
        renderRowDetail && (
          <ResponsiveSheetDrawer
            open={!!selectedRow}
            onOpenChange={(open) => !open && handleCloseRowDetail()}
            sheetSide="right"
            drawerDirection="bottom"
          >
            <ResponsiveSheetDrawer.Content className="border-border bg-background text-foreground overflow-y-auto">
              {renderRowDetail(selectedRow)}
            </ResponsiveSheetDrawer.Content>
          </ResponsiveSheetDrawer>
        )}

      {openOnRowActionType === "dialog" &&
        selectedRow != null &&
        renderRowDetail && (
          <ResponsiveSheetDrawer
            open={!!selectedRow}
            onOpenChange={(open) => !open && handleCloseRowDetail()}
            sheetSide="right"
            drawerDirection="bottom"
          >
            <ResponsiveSheetDrawer.Content className="max-w-2xl border-border bg-background text-foreground overflow-y-auto">
              <ResponsiveSheetDrawer.Header>
                <ResponsiveSheetDrawer.Title className="text-foreground">
                  Detalhe
                </ResponsiveSheetDrawer.Title>
              </ResponsiveSheetDrawer.Header>
              {renderRowDetail(selectedRow)}
            </ResponsiveSheetDrawer.Content>
          </ResponsiveSheetDrawer>
        )}

      {openOnRowActionType === "popover" &&
        selectedRow != null &&
        renderRowDetail && (
          <ResponsiveSheetDrawer
            open={popoverOpen}
            onOpenChange={(open) => !open && handleCloseRowDetail()}
            sheetSide="right"
            drawerDirection="bottom"
          >
            <ResponsiveSheetDrawer.Content className="max-w-sm border-border bg-background text-foreground">
              {renderRowDetail(selectedRow)}
            </ResponsiveSheetDrawer.Content>
          </ResponsiveSheetDrawer>
        )}
    </div>
  );

  if (cardStyle) {
    return (
      <Card className="border-border bg-card text-card-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            {cardTitle != null && (
              <CardTitle className="text-card-foreground">
                {cardTitle}
              </CardTitle>
            )}
            {cardDescription != null && (
              <CardDescription className="text-muted-foreground">
                {cardDescription}
              </CardDescription>
            )}
          </div>
          {cardActions}
        </CardHeader>
        <CardContent>{tableContent}</CardContent>
      </Card>
    );
  }

  return tableContent;
}

DataTable.displayName = "DataTable";
