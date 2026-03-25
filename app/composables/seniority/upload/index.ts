import { parseDate } from '@internationalized/date'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { ColumnMap } from '~/utils/parse-spreadsheet'
import type { SeniorityUpload } from './types'
import { _useProgressTracker } from './_useProgressTracker'
import { _useFileIO } from './_useFileIO'
import { _useColumnMapping } from './_useColumnMapping'
import { _useReview } from './_useReview'
import { _useConfirm } from './_useConfirm'

export type { SeniorityUpload, ProcessingPhase, ProgressTracker } from './types'

const DEFAULT_COLUMN_MAP: ColumnMap = {
  seniority_number: -1,
  employee_number: -1,
  seat: -1,
  base: -1,
  fleet: -1,
  name: -1,
  hire_date: -1,
  retire_date: -1,
}

export function useSeniorityUpload(): SeniorityUpload {
  // ── Shared refs (owned here, passed to phases) ──────────────────────────

  const selectedParserId = ref<string | null>(null)
  const rawHeaders = ref<string[]>([])
  const rawRows = ref<string[][]>([])
  const extractedEffectiveDate = ref<string | null>(null)
  const extractedTitle = ref<string | null>(null)
  const syntheticNote = ref<string | null>(null)
  const syntheticIndices = ref<Set<number>>(new Set())
  const autoDetectSucceeded = ref(false)
  const columnMap = ref<ColumnMap>({ ...DEFAULT_COLUMN_MAP })
  const entries = ref<Partial<SeniorityEntry>[]>([])
  const rowErrors = shallowRef<Map<number, string[]>>(new Map())
  const error = ref<string | null>(null)

  // ── Progress (cross-cutting) ────────────────────────────────────────────

  const progress = _useProgressTracker()

  // ── Phase construction (order matters: downstream before upstream) ──────

  const review = _useReview({
    entries,
    rowErrors,
    syntheticNote,
    syntheticIndices,
    progress,
  })

  const confirm = _useConfirm({ error })

  function resetDownstream() {
    rawHeaders.value = []
    rawRows.value = []
    columnMap.value = { ...DEFAULT_COLUMN_MAP }
    extractedEffectiveDate.value = null
    extractedTitle.value = null
    syntheticNote.value = null
    syntheticIndices.value = new Set()
    autoDetectSucceeded.value = false
    error.value = null
    review._reset()
    confirm._reset()
    mapping._reset()
  }

  const mapping = _useColumnMapping({
    rawRows,
    rawHeaders,
    columnMap,
    progress,
    extractedEffectiveDate,
    extractedTitle,
    async onMapped(mapped: Partial<SeniorityEntry>[]) {
      entries.value = mapped
      await review.validate()
    },
    onMetadataReady(date, title) {
      if (date) {
        confirm.effectiveDate.value = parseDate(date)
      } else {
        confirm.effectiveDate.value = parseDate(new Date().toISOString().split('T')[0]!)
      }
      if (title && !confirm.title.value) {
        confirm.title.value = title
      }
    },
  })

  const file = _useFileIO({
    selectedParserId,
    rawHeaders,
    rawRows,
    extractedEffectiveDate,
    extractedTitle,
    syntheticNote,
    syntheticIndices,
    columnMap,
    autoDetectSucceeded,
    progress,
    onSheetChange: resetDownstream,
  })

  // ── Reset ───────────────────────────────────────────────────────────────

  function reset() {
    selectedParserId.value = null
    file._reset()
    resetDownstream()
    progress.idle()
  }

  return {
    selectedParserId,
    file,
    mapping,
    review,
    confirm,
    progress,
    reset,
  }
}
