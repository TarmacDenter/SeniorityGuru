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

  function clearStructuralErrors(errors: Map<number, string[]>): Map<number, string[]> {
    const cleaned = new Map<number, string[]>()
    errors.forEach((msgs, idx) => {
      const filtered = msgs.filter(m =>
        !m.startsWith('seniority_number: Duplicate') &&
        !m.startsWith('seniority_number: Non-contiguous'),
      )
      if (filtered.length > 0) cleaned.set(idx, filtered)
    })
    return cleaned
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
    opts.rowErrors.value = clearStructuralErrors(reindexed)
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
    opts.rowErrors.value = clearStructuralErrors(reindexed)
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
    insertRowAt,
    validate,
    _reset: reset,
  }
}
