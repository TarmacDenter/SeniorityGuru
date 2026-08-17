import { ref, shallowRef } from 'vue'
import type { ImportIssue, PreparedSheet } from '~/utils/import-pipeline/types'
import type { SeniorityEntryInput } from '~/utils/schemas/seniority-list'
import { DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS } from './defaults'
import { _useProgressTracker } from './_useProgressTracker'
import type { UploadSession } from './types'

export function createUploadSession(overrides: Partial<UploadSession> = {}): UploadSession {
  return {
    selectedUploadTypeId: ref<string | null>(null),
    rawHeaders: ref<string[]>([]),
    rawRows: ref<string[][]>([]),
    extractedEffectiveDate: ref<string | null>(null),
    extractedTitle: ref<string | null>(null),
    syntheticNote: ref<string | null>(null),
    syntheticIndices: ref<Set<number>>(new Set()),
    columnMap: ref({ ...DEFAULT_COLUMN_MAP }),
    mappingOptions: ref({ ...DEFAULT_MAPPING_OPTIONS }),
    autoDetectSucceeded: ref(false),
    preparedSheet: ref<PreparedSheet | null>(null),
    preparationIssues: ref<ImportIssue[]>([]),
    entries: ref<Partial<SeniorityEntryInput>[]>([]),
    rowErrors: shallowRef<Map<number, string[]>>(new Map()),
    pipelineIssues: shallowRef<Map<number, ImportIssue[]>>(new Map()),
    sourceValues: ref<Map<number, Record<string, unknown>>>(new Map()),
    importAttemptId: ref<string | null>(null),
    error: ref<string | null>(null),
    progress: _useProgressTracker(),
    onSheetChange: () => {},
    onMapped: async () => {},
    onMetadataReady: () => {},
    ...overrides,
  }
}
