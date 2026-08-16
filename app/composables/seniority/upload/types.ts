import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { DateValue } from 'reka-ui'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { ColumnMap, MappingOptions } from '~/utils/parse-spreadsheet'
import type { ImportIssue, ImportPlugin, PreparedSheet, ReviewEditPatch } from '~/utils/import-pipeline/types'

// ── Progress ─────────────────────────────────────────────────────────────────

export type ProcessingPhase = 'idle' | 'reading' | 'parsing' | 'mapping' | 'validating'

export interface ProgressTracker {
  phase: Readonly<Ref<ProcessingPhase>>
  percent: ComputedRef<number | null>
  busy: ComputedRef<boolean>
  report(phase: ProcessingPhase, current: number, total: number): void
  enter(phase: ProcessingPhase): void
  idle(): void
}

/** Durable prepared-column selections used by the upload UI. */
export type UploadColumnMap = Record<keyof ColumnMap, string | null>
export type UploadMappingOptions = Omit<MappingOptions, 'firstNameCol' | 'lastNameCol' | 'dobCol'> & {
  firstNameCol?: string | null
  lastNameCol?: string | null
  dobCol?: string | null
}

// ── Phase: File ──────────────────────────────────────────────────────────────

export interface FilePhase {
  fileName: Readonly<Ref<string>>
  sheetNames: Readonly<Ref<string[]>>
  selectedSheet: Readonly<Ref<string | null>>
  selectedHeaderRow: Readonly<Ref<number>>
  headerRows: Readonly<Ref<string[][]>>
  sourceHeaders: Readonly<Ref<string[]>>
  needsSheetSelection: ComputedRef<boolean>
  hasData: ComputedRef<boolean>
  autoDetected: ComputedRef<boolean>
  excludedRowCount: ComputedRef<number>
  preparationIssues: Readonly<Ref<ImportIssue[]>>
  error: Readonly<Ref<string | null>>

  setFile(file: File | null): Promise<void>
  selectSheet(name: string): Promise<void>
  selectHeaderRow(index: number): void
  reprepare(): Promise<void>
  includeExcludedRows(): void
}

/**
 * Internal state owned by useSeniorityUpload and shared with its private phases.
 * The public upload API deliberately does not expose this coordination detail.
 */
export interface UploadSession {
  selectedUploadTypeId: Ref<string | null>
  rawHeaders: Ref<string[]>
  rawRows: Ref<string[][]>
  extractedEffectiveDate: Ref<string | null>
  extractedTitle: Ref<string | null>
  syntheticNote: Ref<string | null>
  syntheticIndices: Ref<Set<number>>
  columnMap: Ref<UploadColumnMap>
  mappingOptions: Ref<UploadMappingOptions>
  autoDetectSucceeded: Ref<boolean>
  preparedSheet: Ref<PreparedSheet | null>
  preparationIssues: Ref<ImportIssue[]>
  entries: Ref<Partial<SeniorityEntry>[]>
  rowErrors: ShallowRef<Map<number, string[]>>
  pipelineIssues: ShallowRef<Map<number, ImportIssue[]>>
  sourceValues: Ref<Map<number, Record<string, unknown>>>
  importAttemptId: Ref<string | null>
  error: Ref<string | null>
  progress: ProgressTracker
  onSheetChange: () => void
  onMapped(entries: Partial<SeniorityEntry>[], issues: Map<number, ImportIssue[]>, sourceValues: Map<number, Record<string, unknown>>): Promise<void>
  onMetadataReady(effectiveDate: string | null, title: string | null): void
  onReviewChanged?: (action: ReviewEditPatch['action'], entries: Partial<SeniorityEntry>[]) => void
}

// ── Phase: Mapping ───────────────────────────────────────────────────────────

export interface MappingPhase {
  columnMap: Ref<UploadColumnMap>
  mappingOptions: Ref<UploadMappingOptions>
  headers: Readonly<Ref<string[]>>
  columnIds: ComputedRef<string[]>
  sampleRows: ComputedRef<string[][]>
  canAdvance: ComputedRef<boolean>
  error: Readonly<Ref<string | null>>

  apply(): Promise<void>
}

// ── Phase: Review ────────────────────────────────────────────────────────────

export interface ReviewPhase {
  entries: Ref<Partial<SeniorityEntry>[]>
  rowErrors: ShallowRef<Map<number, string[]>>
  errorCount: ComputedRef<number>
  syntheticNote: Ref<string | null>
  syntheticIndices: Ref<Set<number>>
  canAdvance: ComputedRef<boolean>

  updateCell(rowIndex: number, field: keyof SeniorityEntry, value: string | number): void
  deleteRow(rowIndex: number): void
  deleteErrorRows(): number
  insertRowAt(rowIndex: number): void
  acknowledgePipelineIssues(rowIndex: number): void
  pipelineIssueRows: ComputedRef<Set<number>>
  sourceValues: Readonly<Ref<ReadonlyMap<number, Readonly<Record<string, unknown>>>>>
  toValidatedEntries(): SeniorityEntry[]
  validate(): Promise<void>
}

// ── Phase: Confirm ───────────────────────────────────────────────────────────

export interface ConfirmPhase {
  effectiveDate: Ref<DateValue | null>
  title: Ref<string>
  saving: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>

  save(entries: SeniorityEntry[]): Promise<number>
}

// ── Public interface ─────────────────────────────────────────────────────────

export interface SeniorityUpload {
  selectedUploadTypeId: Ref<string | null>
  diagnosticAttemptId: Readonly<Ref<string | null>>
  uploadTypes: ComputedRef<readonly ImportPlugin[]>
  selectUploadType(id: string): Promise<void>
  clearUploadType(): void
  file: FilePhase
  mapping: MappingPhase
  review: ReviewPhase
  confirm: ConfirmPhase
  progress: ProgressTracker
  reset(): void
}
