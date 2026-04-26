import type { ReviewPhase, ReviewPhaseOptions } from './types'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { SeniorityEntrySchema } from '~/utils/schemas/seniority-list'
import { computeStructuralIssues, type ValidationIssue } from '~/utils/validate-entries'
import { BATCH_SIZE } from '~/utils/parse-spreadsheet'
import { createLogger } from '~/utils/logger'

const log = createLogger('upload:review')

function formatSchemaIssues(entry: Partial<SeniorityEntry>): ValidationIssue[] {
  const result = SeniorityEntrySchema.safeParse(entry)
  if (result.success) return []
  return result.error.issues.map(issue => ({
    code: 'schema_violation',
    field: issue.path.join('.'),
    rowIndex: -1,
    message: issue.message,
  }))
}

function formatIssueMessage(issue: ValidationIssue): string {
  return `${issue.field}: ${issue.message}`
}

function isStructuralMessage(raw: string): boolean {
  return raw.startsWith('seniority_number: Duplicate seniority number')
    || raw.startsWith('seniority_number: Non-contiguous sequence')
    || raw.startsWith('employee_number: Duplicate employee number')
}

export function _useReview(opts: ReviewPhaseOptions): ReviewPhase & { _reset: () => void } {
  const errorCount = computed(() => opts.rowErrors.value.size)

  const canAdvance = computed(
    () => errorCount.value === 0 && opts.entries.value.length > 0,
  )

  async function validate() {
    opts.progress.report('validating', 0, opts.entries.value.length)

    const total = opts.entries.value.length
    const schemaIssues = new Map<number, ValidationIssue[]>()

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const end = Math.min(i + BATCH_SIZE, total)
      for (let j = i; j < end; j++) {
        const entry = opts.entries.value[j]!
        const entryIssues = formatSchemaIssues(entry).map(issue => ({ ...issue, rowIndex: j }))
        if (entryIssues.length > 0) schemaIssues.set(j, entryIssues)
      }
      opts.progress.report('validating', end, total)
      if (end < total) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }

    const structural = computeStructuralIssues(opts.entries.value)

    for (const [idx, entryIssues] of schemaIssues) {
      const existing = structural.get(idx) ?? []
      structural.set(idx, [...entryIssues, ...existing])
    }

    opts.rowErrors.value = new Map(
      Array.from(structural.entries()).map(([idx, rowIssues]) => [idx, rowIssues.map(formatIssueMessage)]),
    )
    if (opts.rowErrors.value.size > 0) {
      log.warn('Validation errors found', { errorCount: opts.rowErrors.value.size, totalRows: total })
    }

    opts.progress.idle()
  }

  function revalidateStructural() {
    // Preserve pre-existing non-structural messages, refresh structural messages
    const cleaned = new Map<number, string[]>()
    opts.rowErrors.value.forEach((msgs, idx) => {
      const nonStructural = msgs.filter(msg => !isStructuralMessage(msg))
      if (nonStructural.length > 0) cleaned.set(idx, nonStructural)
    })

    const structural = computeStructuralIssues(opts.entries.value)
    structural.forEach((entryIssues, idx) => {
      const existing = cleaned.get(idx) ?? []
      cleaned.set(idx, [...existing, ...entryIssues.map(formatIssueMessage)])
    })

    opts.rowErrors.value = cleaned
    triggerRef(opts.rowErrors)
  }

  function updateCell(rowIndex: number, field: keyof SeniorityEntry, value: string | number) {
    const entry = opts.entries.value[rowIndex]
    if (!entry) return
    ;(entry as Record<string, unknown>)[field] = value

    // Update schema errors for the edited row (structural refreshed below)
    const issues = formatSchemaIssues(entry)
    if (issues.length === 0) {
      opts.rowErrors.value.delete(rowIndex)
    } else {
      opts.rowErrors.value.set(rowIndex, issues.map(formatIssueMessage))
    }

    revalidateStructural()
  }

  function deleteRow(rowIndex: number) {
    const deleted = opts.entries.value[rowIndex]
    const deletedSenNum = typeof deleted?.seniority_number === 'number' ? deleted.seniority_number : null

    opts.entries.value.splice(rowIndex, 1)

    if (deletedSenNum !== null) {
      const hasDuplicate = opts.entries.value.some(
        e => typeof e.seniority_number === 'number' && e.seniority_number === deletedSenNum,
      )
      if (!hasDuplicate) {
        for (const entry of opts.entries.value) {
          if (typeof entry.seniority_number === 'number' && entry.seniority_number > deletedSenNum) {
            entry.seniority_number--
          }
        }
      }
    }

    const reindexed = new Map<number, string[]>()
    opts.rowErrors.value.forEach((errs, idx) => {
      if (idx < rowIndex) reindexed.set(idx, errs)
      else if (idx > rowIndex) reindexed.set(idx - 1, errs)
    })
    opts.rowErrors.value = reindexed

    revalidateStructural()
  }

  function insertRowAt(rowIndex: number) {
    const target = opts.entries.value[rowIndex]
    const targetSenNum = typeof target?.seniority_number === 'number' ? target.seniority_number : null

    if (targetSenNum !== null) {
      for (const entry of opts.entries.value) {
        if (typeof entry.seniority_number === 'number' && entry.seniority_number >= targetSenNum) {
          entry.seniority_number++
        }
      }
    }

    const newEntry: Partial<SeniorityEntry> = {
      seniority_number: targetSenNum ?? undefined,
      employee_number: '',
      name: '',
      seat: '',
      base: '',
      fleet: '',
      hire_date: '',
      retire_date: '',
    }

    opts.entries.value.splice(rowIndex, 0, newEntry)

    const reindexed = new Map<number, string[]>()
    opts.rowErrors.value.forEach((errs, idx) => {
      reindexed.set(idx < rowIndex ? idx : idx + 1, errs)
    })

    // Immediately surface schema errors for the blank row
    const blankResult = SeniorityEntrySchema.safeParse(newEntry)
    if (!blankResult.success) {
      reindexed.set(rowIndex, blankResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`))
    }

    opts.rowErrors.value = reindexed

    revalidateStructural()
  }

  function deleteErrorRows(): number {
    const errorIndices = new Set(opts.rowErrors.value.keys())
    if (errorIndices.size === 0) return 0
    const count = errorIndices.size
    opts.entries.value = opts.entries.value.filter((_, i) => !errorIndices.has(i))

    // Renumber surviving entries to keep the sequence contiguous
    opts.entries.value.forEach((entry, i) => {
      if (typeof entry.seniority_number === 'number') {
        entry.seniority_number = i + 1
      }
    })

    opts.rowErrors.value = new Map()
    revalidateStructural()
    return count
  }

  function reset() {
    opts.entries.value = []
    opts.rowErrors.value = new Map()
  }

  function toValidatedEntries(): SeniorityEntry[] {
    if (opts.rowErrors.value.size > 0) {
      throw new Error('Cannot convert to validated entries while row errors exist')
    }
    return opts.entries.value.map((entry, idx) => {
      const parsed = SeniorityEntrySchema.safeParse(entry)
      if (!parsed.success) {
        throw new Error(`Row ${idx + 1} is not schema-valid`)
      }
      return parsed.data
    })
  }

  return {
    entries: opts.entries,
    rowErrors: opts.rowErrors,
    errorCount,
    syntheticNote: opts.syntheticNote,
    syntheticIndices: opts.syntheticIndices,
    canAdvance,
    updateCell,
    deleteRow,
    deleteErrorRows,
    insertRowAt,
    toValidatedEntries,
    validate,
    _reset: reset,
  }
}
