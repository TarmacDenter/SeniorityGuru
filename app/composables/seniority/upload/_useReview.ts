import type { ReviewPhase, ReviewPhaseOptions } from './types'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { SeniorityEntrySchema } from '~/utils/schemas/seniority-list'
import { validateEntries } from '~/utils/validate-entries'
import { BATCH_SIZE } from '~/utils/parse-spreadsheet'
import { createLogger } from '~/utils/logger'

const log = createLogger('upload:review')

export function _useReview(opts: ReviewPhaseOptions): ReviewPhase & { _reset: () => void } {
  const errorCount = computed(() => opts.rowErrors.value.size)

  const canAdvance = computed(
    () => errorCount.value === 0 && opts.entries.value.length > 0,
  )

  async function validate() {
    opts.progress.report('validating', 0, opts.entries.value.length)

    const total = opts.entries.value.length
    const schemaErrors = new Map<number, string[]>()

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const end = Math.min(i + BATCH_SIZE, total)
      for (let j = i; j < end; j++) {
        const entry = opts.entries.value[j]!
        const result = SeniorityEntrySchema.safeParse(entry)
        if (!result.success) {
          schemaErrors.set(j, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
        }
      }
      opts.progress.report('validating', end, total)
      if (end < total) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }

    const structuralErrors = validateEntries(opts.entries.value)

    for (const [idx, msgs] of schemaErrors) {
      const existing = structuralErrors.get(idx)
      if (existing) existing.unshift(...msgs)
      else structuralErrors.set(idx, msgs)
    }

    opts.rowErrors.value = structuralErrors
    if (structuralErrors.size > 0) {
      log.warn('Validation errors found', { errorCount: structuralErrors.size, totalRows: total })
    }

    opts.progress.idle()
  }

  function updateCell(rowIndex: number, field: keyof SeniorityEntry, value: string | number) {
    const entry = opts.entries.value[rowIndex]
    if (!entry) return
    ;(entry as Record<string, unknown>)[field] = value
    const result = SeniorityEntrySchema.safeParse(entry)
    if (result.success) {
      opts.rowErrors.value.delete(rowIndex)
    } else {
      opts.rowErrors.value.set(rowIndex, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`))
    }
    triggerRef(opts.rowErrors)
  }

  function deleteRow(rowIndex: number) {
    opts.entries.value.splice(rowIndex, 1)
    const newErrors = new Map<number, string[]>()
    opts.rowErrors.value.forEach((errs, idx) => {
      if (idx < rowIndex) newErrors.set(idx, errs)
      else if (idx > rowIndex) newErrors.set(idx - 1, errs)
    })
    opts.rowErrors.value = newErrors
  }

  function deleteErrorRows(): number {
    const errorIndices = new Set(opts.rowErrors.value.keys())
    if (errorIndices.size === 0) return 0
    const count = errorIndices.size
    opts.entries.value = opts.entries.value.filter((_, i) => !errorIndices.has(i))
    opts.rowErrors.value = new Map()
    return count
  }

  function reset() {
    opts.entries.value = []
    opts.rowErrors.value = new Map()
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
    validate,
    _reset: reset,
  }
}
