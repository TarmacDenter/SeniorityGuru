import { z } from 'zod'
import type {
  ImportPlugin,
  PrepareImportResult,
  PreparedColumn,
  PreparedSheet,
  PreparationPatch,
  SourceSheet,
} from './types'

const importFieldSchema = z.enum([
  'seniority_number',
  'employee_number',
  'name',
  'seat',
  'base',
  'fleet',
  'hire_date',
  'retire_date',
])

const preparationPatchSchema = z.object({
  columns: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    sourceColumnId: z.string().min(1).optional(),
  })).optional(),
  cellValues: z.record(z.string().min(1), z.record(z.string().min(1), z.union([z.string(), z.number(), z.boolean(), z.null()]))).optional(),
  mappingSuggestions: z.record(importFieldSchema, z.string().min(1)).optional(),
  issues: z.array(z.object({
    kind: z.enum(['ambiguous-alias', 'preparation-failed', 'transformation-failed', 'validation-failed']),
    field: importFieldSchema.optional(),
    message: z.string().min(1),
  })).optional(),
  metadata: z.object({ effectiveDate: z.string().min(1).optional(), title: z.string().min(1).optional() }).optional(),
  excludedSourceRowIds: z.array(z.string().min(1)).optional(),
}).strict()

const importPluginSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Import plugin id must be a permanent lowercase slug.'),
  label: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  formatDescription: z.string().min(1),
  requiredMappings: z.array(importFieldSchema).optional(),
  suggestHeaderRow: z.function().optional(),
  prepare: z.function(),
  transformMappedEntry: z.function().optional(),
}).strict()

/**
 * Validates stable plugin metadata at registration time. Plugins remain pure,
 * synchronous definitions; the pipeline validates their returned patches.
 */
export function defineImportPlugin(plugin: ImportPlugin): ImportPlugin {
  return importPluginSchema.parse(plugin) as ImportPlugin
}

function sourceColumns(sheet: SourceSheet): PreparedColumn[] {
  return sheet.columns.map(column => ({
    id: column.id,
    label: column.label ?? column.id,
  }))
}

function applyPatch(sourceSheet: SourceSheet, preparedSourceColumns: readonly PreparedColumn[], patch: PreparationPatch): PreparedSheet {
  const columns = [...preparedSourceColumns, ...(patch.columns ?? [])]
  const sourceColumnIds = sourceSheet.columns.map(column => column.id)

  return {
    sourceSheet,
    columns,
    rows: sourceSheet.rows.map(row => {
      const cells: Record<string, typeof row.cells[number]> = {}
      for (const [index, columnId] of sourceColumnIds.entries()) cells[columnId] = row.cells[index] ?? null
      for (const column of patch.columns ?? []) {
        cells[column.id] = patch.cellValues?.[column.id]?.[row.id]
          ?? (column.sourceColumnId ? cells[column.sourceColumnId] ?? null : null)
      }
      return { sourceRowId: row.id, cells }
    }),
  }
}

/**
 * Prepares a selected Source Sheet with one explicitly chosen Import Plugin.
 * A plugin error never drops source data: callers receive a manually mappable
 * sheet plus a typed preparation issue.
 */
export function prepareImport({
  plugin,
  sourceSheet,
  headerRowIndex,
}: {
  readonly plugin: ImportPlugin
  readonly sourceSheet: SourceSheet
  /** A user-confirmed source row that supplies column labels and is excluded from mapping. */
  readonly headerRowIndex?: number
}): PrepareImportResult {
  const headerRow = headerRowIndex === undefined ? undefined : sourceSheet.rows[headerRowIndex]
  const sheetForPreparation = headerRow
    ? {
        ...sourceSheet,
        columns: sourceSheet.columns.map((column, index) => ({
          ...column,
          label: typeof headerRow.cells[index] === 'string' ? headerRow.cells[index] : column.label,
        })),
        rows: sourceSheet.rows,
      }
    : sourceSheet
  let patch: PreparationPatch
  try {
    patch = preparationPatchSchema.parse(plugin.prepare(sheetForPreparation))
  } catch {
    patch = {
      issues: [{
        kind: 'preparation-failed',
        message: 'This Upload Type could not prepare the sheet. Match the columns manually.',
      }],
    }
  }

  const preparedSheet = applyPatch(sourceSheet, sourceColumns(sheetForPreparation), patch)
  const excluded = new Set(patch.excludedSourceRowIds ?? [])
  const rows = headerRowIndex === undefined
    ? preparedSheet.rows.map(row => excluded.has(row.sourceRowId) ? { ...row, included: false } : row)
    : preparedSheet.rows.map((row, index) => index > headerRowIndex && !excluded.has(row.sourceRowId) ? row : { ...row, included: false })
  return {
    preparedSheet: { ...preparedSheet, rows },
    mappingSuggestions: patch.mappingSuggestions ?? {},
    issues: patch.issues ?? [],
    metadata: { effectiveDate: patch.metadata?.effectiveDate ?? null, title: patch.metadata?.title ?? null },
  }
}
