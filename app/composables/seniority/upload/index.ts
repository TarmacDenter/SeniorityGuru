import { parseDate } from '@internationalized/date'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { todayISO } from '~/utils/date'
import type { ColumnMap } from '~/utils/parse-spreadsheet'
import type { ImportIssue, PreparedSheet } from '~/utils/import-pipeline/types'
import type { SeniorityUpload } from './types'
import { _useProgressTracker } from './_useProgressTracker'
import { _useFileIO } from './_useFileIO'
import { _useColumnMapping } from './_useColumnMapping'
import { _useReview } from './_useReview'
import { _useConfirm } from './_useConfirm'
import { DEFAULT_COLUMN_MAP } from './defaults'
import { DEFAULT_MAPPING_OPTIONS } from './defaults'
import { useUserStore } from '~/stores/user'
import { getImportPlugin, importPlugins } from '~/utils/import-pipeline/plugins/registry'

export type { SeniorityUpload, ProcessingPhase, ProgressTracker } from './types'

export function useSeniorityUpload(): SeniorityUpload {
  const userStore = useUserStore()
  // ── Shared refs (owned here, passed to phases) ──────────────────────────

  const selectedParserId = ref<string | null>(null)
  const preferredUploadType = ref<string | null>(null)
  const uploadTypes = computed(() => {
    const preferred = preferredUploadType.value
    return preferred ? [...importPlugins].sort((a, b) => Number(b.id === preferred) - Number(a.id === preferred)) : importPlugins
  })
  const rawHeaders = ref<string[]>([])
  const rawRows = ref<string[][]>([])
  const extractedEffectiveDate = ref<string | null>(null)
  const extractedTitle = ref<string | null>(null)
  const syntheticNote = ref<string | null>(null)
  const syntheticIndices = ref<Set<number>>(new Set())
  const autoDetectSucceeded = ref(false)
  const preparedSheet = ref<PreparedSheet | null>(null)
  const columnMap = ref<ColumnMap>({ ...DEFAULT_COLUMN_MAP })
  const mappingOptions = ref({ ...DEFAULT_MAPPING_OPTIONS })
  const entries = ref<Partial<SeniorityEntry>[]>([])
  const rowErrors = shallowRef<Map<number, string[]>>(new Map())
  const pipelineIssues = shallowRef<Map<number, ImportIssue[]>>(new Map())
  const error = ref<string | null>(null)

  watch(selectedParserId, (uploadType) => {
    if (uploadType) userStore.savePreference('lastUploadType', uploadType).catch(() => {})
  })
  void userStore.getPreference('lastUploadType').then((id) => {
    if (id && getImportPlugin(id)) preferredUploadType.value = id
  }).catch(() => {})

  let file: ReturnType<typeof _useFileIO>

  async function selectUploadType(id: string) {
    if (!getImportPlugin(id)) return
    selectedParserId.value = id
    await file.reprepare()
  }

  function clearUploadType() {
    selectedParserId.value = null
    resetDownstream()
  }

  // ── Progress (cross-cutting) ────────────────────────────────────────────

  const progress = _useProgressTracker()

  // ── Phase construction (order matters: downstream before upstream) ──────

  const review = _useReview({
    entries,
    rowErrors,
    pipelineIssues,
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
    preparedSheet.value = null
    error.value = null
    review._reset()
    confirm._reset()
    mapping._reset()
  }

  const mapping = _useColumnMapping({
    rawRows,
    rawHeaders,
    columnMap,
    mappingOptions,
    progress,
    extractedEffectiveDate,
    extractedTitle,
    selectedParserId,
    uploadTypes,
    selectUploadType,
    preparedSheet,
    async onMapped(mapped: Partial<SeniorityEntry>[], issues: Map<number, ImportIssue[]>) {
      entries.value = mapped
      pipelineIssues.value = issues
      await review.validate()
    },
    onMetadataReady(date, title) {
      if (date) {
        confirm.effectiveDate.value = parseDate(date)
      } else {
        confirm.effectiveDate.value = parseDate(todayISO())
      }
      if (title && !confirm.title.value) {
        confirm.title.value = title
      }
    },
  })

  file = _useFileIO({
    selectedParserId,
    rawHeaders,
    rawRows,
    extractedEffectiveDate,
    extractedTitle,
    syntheticNote,
    syntheticIndices,
    columnMap,
    mappingOptions,
    autoDetectSucceeded,
    preparedSheet,
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
    uploadTypes,
    selectUploadType,
    clearUploadType,
    file,
    mapping,
    review,
    confirm,
    progress,
    reset,
  }
}
