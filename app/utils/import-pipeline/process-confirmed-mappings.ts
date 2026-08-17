import type { SeniorityEntryInput } from '../schemas/seniority-list'
import { SeniorityEntrySchema } from '../schemas/seniority-list'
import { computeRetireDate, normalizeDate } from '../date'
import { z } from 'zod'
import { ImportFieldSchema, normalizeMappedEntry, validateImportEntry } from './fields'
import type {
  ConfirmedMappings,
  DraftSeniorityEntry,
  EntryPatch,
  ImportField,
  ImportIssue,
  ImportPlugin,
  PreparedRow,
  PreparedSheet,
  ProcessConfirmedMappingsResult,
} from './types'

const importIssueSchema = z.object({
  kind: z.enum(['ambiguous-alias', 'preparation-failed', 'transformation-failed', 'validation-failed']),
  field: ImportFieldSchema.optional(),
  message: z.string().min(1),
}).strict()

const entryPatchSchema: z.ZodType<EntryPatch> = z.object({
  entry: z.object({
    seniority_number: SeniorityEntrySchema.shape.seniority_number,
    employee_number: SeniorityEntrySchema.shape.employee_number,
    name: SeniorityEntrySchema.shape.name.unwrap(),
    seat: SeniorityEntrySchema.shape.seat,
    base: SeniorityEntrySchema.shape.base,
    fleet: SeniorityEntrySchema.shape.fleet,
    hire_date: SeniorityEntrySchema.shape.hire_date,
    retire_date: SeniorityEntrySchema.shape.retire_date,
  }).partial().strict().optional(),
  issues: z.array(importIssueSchema).optional(),
}).strict()

function cloneAndFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object') return value
  const clone = (Array.isArray(value)
    ? value.map(item => cloneAndFreeze(item))
    : Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cloneAndFreeze(nested)]))) as T
  return Object.freeze(clone)
}

function text(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const result = String(value).trim()
  return result || undefined
}

function columnValue(row: PreparedRow, columnId: string): string | undefined {
  return text(row.cells[columnId])
}

function mapField(field: ImportField, row: PreparedRow, mappings: ConfirmedMappings): string | undefined {
  const mapping = mappings[field]
  if (!mapping) return undefined
  if (mapping.kind === 'column') return columnValue(row, mapping.columnId)
  if (mapping.kind === 'combined-name') {
    return [columnValue(row, mapping.lastNameColumnId), columnValue(row, mapping.firstNameColumnId)]
      .filter((value): value is string => value !== undefined)
      .join(', ') || undefined
  }
  if (mapping.kind === 'retirement-from-birth-date') {
    const birthDate = columnValue(row, mapping.columnId)
    return birthDate ? computeRetireDate(normalizeDate(birthDate), mapping.retirementAge) : undefined
  }
  return undefined
}

function mapEntry(row: PreparedRow, mappings: ConfirmedMappings): Partial<SeniorityEntryInput> {
  return normalizeMappedEntry({
    seniority_number: mapField('seniority_number', row, mappings),
    employee_number: mapField('employee_number', row, mappings),
    name: mapField('name', row, mappings),
    seat: mapField('seat', row, mappings),
    base: mapField('base', row, mappings),
    fleet: mapField('fleet', row, mappings),
    hire_date: mapField('hire_date', row, mappings),
    retire_date: mapField('retire_date', row, mappings),
  })
}

function validationIssues(entry: Partial<SeniorityEntryInput>): ImportIssue[] {
  const result = validateImportEntry(entry)
  if (result.success) return []
  return result.error.issues.map(issue => ({
    kind: 'validation-failed',
    field: ImportFieldSchema.safeParse(issue.path[0]).data,
    message: issue.message,
  }))
}

async function nextBatch(): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

/**
 * Maps user-confirmed Prepared Column selections into independent review drafts.
 * The function is cancellable and yields after each batch to keep the upload
 * screen responsive.
 */
export async function processConfirmedMappings({
  preparedSheet,
  mappings,
  plugin,
  signal,
}: {
  readonly preparedSheet: PreparedSheet
  readonly mappings: ConfirmedMappings
  readonly plugin?: ImportPlugin
  readonly signal?: AbortSignal
}): Promise<ProcessConfirmedMappingsResult> {
  const drafts: DraftSeniorityEntry[] = []
  const batchSize = 500

  for (let index = 0; index < preparedSheet.rows.length; index++) {
    if (signal?.aborted) throw new DOMException('Import processing was cancelled.', 'AbortError')
    const preparedRow = preparedSheet.rows[index]!
    if (preparedRow.included === false) continue
    let entry = mapEntry(preparedRow, mappings)
    let issues: ImportIssue[] = []
    let draft: DraftSeniorityEntry = {
      id: `draft:${preparedRow.sourceRowId}`,
      sourceRowId: preparedRow.sourceRowId,
      entry,
      issues,
    }

    if (plugin?.transformMappedEntry) {
      try {
        const patch = entryPatchSchema.parse(plugin.transformMappedEntry(cloneAndFreeze({ draft, preparedRow })))
        entry = { ...entry, ...(patch.entry ?? {}) }
        issues = [...issues, ...(patch.issues ?? [])]
      } catch {
        issues = [...issues, {
          kind: 'transformation-failed',
          message: 'This row could not be transformed. Review its mapped values.',
        }]
      }
      draft = { ...draft, entry, issues }
    }

    drafts.push({ ...draft, issues: [...issues, ...validationIssues(entry)] })
    if ((index + 1) % batchSize === 0) await nextBatch()
  }

  const issues = drafts.flatMap(draft => draft.issues)
  return {
    drafts,
    issues,
    diagnostics: { includedRowCount: drafts.length, issueCount: issues.length },
  }
}
