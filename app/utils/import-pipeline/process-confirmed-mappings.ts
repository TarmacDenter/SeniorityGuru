import { normalizeDate, normalizeDateFuture, computeRetireDate } from '../date'
import { normalizeEmployeeNumber, SeniorityEntrySchema } from '../schemas/seniority-list'
import { z } from 'zod'
import type {
  ConfirmedMappings,
  DraftSeniorityEntry,
  ImportField,
  ImportIssue,
  ImportPlugin,
  PreparedRow,
  PreparedSheet,
  ProcessConfirmedMappingsResult,
} from './types'

const importIssueSchema = z.object({
  kind: z.enum(['ambiguous-alias', 'preparation-failed', 'transformation-failed', 'validation-failed']),
  field: z.enum([
    'seniority_number', 'employee_number', 'name', 'seat', 'base', 'fleet', 'hire_date', 'retire_date',
  ]).optional(),
  message: z.string().min(1),
}).strict()

const entryPatchSchema = z.object({
  entry: z.object({
    seniority_number: z.unknown(),
    employee_number: z.unknown(),
    name: z.unknown(),
    seat: z.unknown(),
    base: z.unknown(),
    fleet: z.unknown(),
    hire_date: z.unknown(),
    retire_date: z.unknown(),
  }).partial().strict().optional(),
  issues: z.array(importIssueSchema).optional(),
}).strict()

function text(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const result = String(value).trim()
  return result || undefined
}

function columnValue(row: PreparedRow, columnId: string): string | undefined {
  return text(row.cells[columnId])
}

function mapField(field: ImportField, row: PreparedRow, mappings: ConfirmedMappings): unknown {
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

function mapEntry(row: PreparedRow, mappings: ConfirmedMappings): Record<string, unknown> {
  const entry: Record<string, unknown> = {}
  for (const field of ['seniority_number', 'employee_number', 'name', 'seat', 'base', 'fleet', 'hire_date', 'retire_date'] as const) {
    const value = mapField(field, row, mappings)
    if (value !== undefined) entry[field] = value
  }

  if (typeof entry.seniority_number === 'string') entry.seniority_number = Number.parseInt(entry.seniority_number, 10)
  if (typeof entry.employee_number === 'string') entry.employee_number = normalizeEmployeeNumber(entry.employee_number)
  if (typeof entry.hire_date === 'string') entry.hire_date = normalizeDate(entry.hire_date)
  if (typeof entry.retire_date === 'string') entry.retire_date = normalizeDateFuture(entry.retire_date)
  for (const field of ['base', 'seat', 'fleet']) {
    if (typeof entry[field] === 'string') entry[field] = entry[field].toUpperCase()
  }
  return entry
}

function validationIssues(entry: Record<string, unknown>): ImportIssue[] {
  const result = SeniorityEntrySchema.safeParse(entry)
  if (result.success) return []
  return result.error.issues.map(issue => ({
    kind: 'validation-failed' as const,
    field: issue.path[0] as ImportField | undefined,
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
        const patch = entryPatchSchema.parse(plugin.transformMappedEntry({ draft, preparedRow }))
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
