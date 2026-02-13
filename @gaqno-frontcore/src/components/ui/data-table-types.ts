import type { SortingState } from '@tanstack/react-table'

export type DataTableDataProp<TData> =
  | TData[]
  | { data: TData[]; error?: Error; isLoading?: boolean }

export type Updater<T> = T | ((old: T) => T)

export interface DataTableSorterProps {
  sorting: SortingState
  onSortingChange: (updater: Updater<SortingState>) => void
}

export type OpenOnRowActionType = 'sheet' | 'dialog' | 'popover'
