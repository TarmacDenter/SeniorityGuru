import { parseDate } from '@internationalized/date'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { todayISO } from '~/utils/date'
import type { ImportIssue, PreparedSheet, ReviewEditPatch } from '~/utils/import-pipeline/types'
import type { SeniorityUpload, UploadColumnMap } from './types'
import { _useProgressTracker } from './_useProgressTracker'
import { _useFileIO } from './_useFileIO'
import { _useColumnMapping } from './_useColumnMapping'
import { _useReview } from './_useReview'
import { _useConfirm } from './_useConfirm'
import { DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS } from './defaults'
import { useUserStore } from '~/stores/user'
import { getImportPlugin, importPlugins } from '~/utils/import-pipeline/plugins/registry'
import { useImportAttemptsStore } from '~/stores/import-attempts'

export type { SeniorityUpload, ProcessingPhase, ProgressTracker } from './types'

export function useSeniorityUpload(): SeniorityUpload {
  const userStore = useUserStore()
  const importAttemptsStore = useImportAttemptsStore()
  // ── Shared refs (owned here, passed to phases) ──────────────────────────

  const selectedUploadTypeId = ref<string | null>(null)
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
  const preparationIssues = ref<ImportIssue[]>([])
  const columnMap = ref<UploadColumnMap>({ ...DEFAULT_COLUMN_MAP })
  const mappingOptions = ref({ ...DEFAULT_MAPPING_OPTIONS })
  const entries = ref<Partial<SeniorityEntry>[]>([])
  const rowErrors = shallowRef<Map<number, string[]>>(new Map())
  const pipelineIssues = shallowRef<Map<number, ImportIssue[]>>(new Map())
  const sourceValues = ref<Map<number, Record<string, unknown>>>(new Map())
  const importAttemptId = ref<string | null>(null)
  const error = ref<string | null>(null)

  watch(selectedUploadTypeId, (uploadType) => {
    if (uploadType) userStore.savePreference('lastUploadType', uploadType).catch(() => {})
  })
  void userStore.getPreference('lastUploadType').then((id) => {
    if (id && getImportPlugin(id)) preferredUploadType.value = id
  }).catch(() => {})

  async function selectUploadType(id: string) {
    if (!getImportPlugin(id)) return
    selectedUploadTypeId.value = id
    await file.reprepare()
  }

  function clearUploadType() {
    selectedUploadTypeId.value = null
    resetDownstream()
  }

  // ── Progress (cross-cutting) ────────────────────────────────────────────

  const progress = _useProgressTracker()

  // ── Phase construction (order matters: downstream before upstream) ──────

  const review = _useReview({
    entries,
    rowErrors,
    pipelineIssues,
    sourceValues,
    syntheticNote,
    syntheticIndices,
    progress,
    onReviewChanged(action, changedEntries) {
      const id = importAttemptId.value
      if (!id) return
      const at = new Date().toISOString()
      void importAttemptsStore.updateTrace(id, trace => ({
          ...trace,
          review: {
            editPatches: [...(trace.review?.editPatches ?? []), { action, entries: changedEntries, at } satisfies ReviewEditPatch],
          },
          stage: 'review',
          updatedAt: at,
        }))
    },
  })

  const confirm = _useConfirm({ error, importAttemptId })

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
    preparationIssues.value = []
    importAttemptId.value = null
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
    selectedUploadTypeId,
    preparedSheet,
    preparationIssues,
    importAttemptId,
    async onMapped(mapped: Partial<SeniorityEntry>[], issues: Map<number, ImportIssue[]>, mappedSourceValues: Map<number, Record<string, unknown>>) {
      entries.value = mapped
      pipelineIssues.value = issues
      sourceValues.value = mappedSourceValues
      await review.validate()
      const id = importAttemptId.value
      if (id) {
        const validationErrors = Object.fromEntries([...rowErrors.value].map(([index, issues]) => [String(index), issues]))
        await importAttemptsStore.updateTrace(id, trace => ({
          ...trace,
          validation: { rowErrors: validationErrors },
          stage: 'review',
          updatedAt: new Date().toISOString(),
        }))
      }
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

  const file = _useFileIO({
    selectedUploadTypeId,
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
    preparationIssues,
    progress,
    onSheetChange: resetDownstream,
  })

  // ── Reset ───────────────────────────────────────────────────────────────

  function reset() {
    selectedUploadTypeId.value = null
    file._reset()
    resetDownstream()
    progress.idle()
  }

  return {
    selectedUploadTypeId,
    diagnosticAttemptId: readonly(importAttemptId),
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
