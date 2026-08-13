import type { UploadColumnMap, UploadMappingOptions } from './types'

export const DEFAULT_COLUMN_MAP: UploadColumnMap = {
  seniority_number: null,
  employee_number: null,
  seat: null,
  base: null,
  fleet: null,
  name: null,
  hire_date: null,
  retire_date: null,
}

export const DEFAULT_MAPPING_OPTIONS: UploadMappingOptions = {
  nameMode: 'single',
  retireMode: 'direct',
}
