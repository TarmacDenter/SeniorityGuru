import type { TableColumn } from '@nuxt/ui'
import { sortableHeader } from '~/utils/sortableHeader'
import type { RetiredPilot, DepartedPilot, QualMove, RankChange, NewHire } from '~/utils/seniority-compare'

export interface FilterConfig {
  key: string
  label: string
}

export const qualMoveFilters: FilterConfig[] = [
  { key: 'old_seat', label: 'Old Seat' },
  { key: 'new_seat', label: 'New Seat' },
  { key: 'old_fleet', label: 'Old Fleet' },
  { key: 'new_fleet', label: 'New Fleet' },
  { key: 'old_base', label: 'Old Base' },
  { key: 'new_base', label: 'New Base' },
]

export const retiredColumns: TableColumn<RetiredPilot>[] = [
  { accessorKey: 'seniority_number', header: sortableHeader<RetiredPilot>('#') },
  { accessorKey: 'employee_number', header: sortableHeader<RetiredPilot>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<RetiredPilot>('Name') },
  { accessorKey: 'retire_date', header: sortableHeader<RetiredPilot>('Retire Date') },
]

export const departedColumns: TableColumn<DepartedPilot>[] = [
  { accessorKey: 'seniority_number', header: sortableHeader<DepartedPilot>('#') },
  { accessorKey: 'employee_number', header: sortableHeader<DepartedPilot>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<DepartedPilot>('Name') },
  { accessorKey: 'retire_date', header: sortableHeader<DepartedPilot>('Retire Date') },
]

export const qualMoveColumns: TableColumn<QualMove>[] = [
  { accessorKey: 'seniority_number', header: sortableHeader<QualMove>('#') },
  { accessorKey: 'employee_number', header: sortableHeader<QualMove>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<QualMove>('Name') },
  { accessorKey: 'old_seat', header: sortableHeader<QualMove>('Old Seat') },
  { accessorKey: 'new_seat', header: sortableHeader<QualMove>('New Seat') },
  { accessorKey: 'old_fleet', header: sortableHeader<QualMove>('Old Fleet') },
  { accessorKey: 'new_fleet', header: sortableHeader<QualMove>('New Fleet') },
  { accessorKey: 'old_base', header: sortableHeader<QualMove>('Old Base') },
  { accessorKey: 'new_base', header: sortableHeader<QualMove>('New Base') },
]

export const rankChangeColumns: TableColumn<RankChange>[] = [
  { accessorKey: 'employee_number', header: sortableHeader<RankChange>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<RankChange>('Name') },
  { accessorKey: 'old_rank', header: sortableHeader<RankChange>('Old Rank') },
  { accessorKey: 'new_rank', header: sortableHeader<RankChange>('New Rank') },
  {
    accessorKey: 'delta',
    header: sortableHeader<RankChange>('Change'),
    cell: ({ row }) => {
      const d = row.original.delta
      return d > 0 ? `+${d}` : `${d}`
    },
  },
]

export const newHireColumns: TableColumn<NewHire>[] = [
  { accessorKey: 'seniority_number', header: sortableHeader<NewHire>('#') },
  { accessorKey: 'employee_number', header: sortableHeader<NewHire>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<NewHire>('Name') },
  { accessorKey: 'hire_date', header: sortableHeader<NewHire>('Hire Date') },
]
