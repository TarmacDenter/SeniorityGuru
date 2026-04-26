import type { ColumnMap, MappingOptions } from '~/utils/parse-spreadsheet'

export const DEFAULT_COLUMN_MAP: ColumnMap = {
  seniority_number: -1,
  employee_number: -1,
  seat: -1,
  base: -1,
  fleet: -1,
  name: -1,
  hire_date: -1,
  retire_date: -1,
}

export const DEFAULT_MAPPING_OPTIONS: MappingOptions = {
  nameMode: 'single',
  retireMode: 'direct',
}
