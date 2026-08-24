import type { Row } from '@tanstack/vue-table'
import { Temporal } from '~/utils/temporal'

/** TanStack sorting functions for Temporal values, which reject value coercion. */
export function plainDateSortingFn<TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string): number {
  return Temporal.PlainDate.compare(rowA.getValue(columnId), rowB.getValue(columnId))
}

export function instantSortingFn<TData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string): number {
  return Temporal.Instant.compare(rowA.getValue(columnId), rowB.getValue(columnId))
}
