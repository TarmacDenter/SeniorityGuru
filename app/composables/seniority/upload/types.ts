import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { DateValue } from 'reka-ui'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { ColumnMap, MappingOptions } from '~/utils/parse-spreadsheet'
import type { PreparedSheet } from '~/utils/import-pipeline/types'

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

// ── Phase: File ──────────────────────────────────────────────────────────────

export interface FilePhase {
  fileName: Readonly<Ref<string>>
  sheetNames: Readonly<Ref<string[]>>
  selectedSheet: Readonly<Ref<string | null>>
  headerRows: Readonly<Ref<string[][]>>
  needsSheetSelection: ComputedRef<boolean>
  hasData: ComputedRef<boolean>
  autoDetected: ComputedRef<boolean>
  error: Readonly<Ref<string | null>>

  setFile(file: File | null): Promise<void>
  selectSheet(name: string): void
  selectHeaderRow(index: number): void
}

export interface FilePhaseOptions {
  selectedParserId: Ref<string | null>
  rawHeaders: Ref<string[]>
  rawRows: Ref<string[][]>
  extractedEffectiveDate: Ref<string | null>
  extractedTitle: Ref<string | null>
  syntheticNote: Ref<string | null>
  syntheticIndices: Ref<Set<number>>
  columnMap: Ref<ColumnMap>
  autoDetectSucceeded: Ref<boolean>
  preparedSheet: Ref<PreparedSheet | null>
  progress: ProgressTracker
  onSheetChange: () => void
}

// ── Phase: Mapping ───────────────────────────────────────────────────────────

export interface MappingPhase {
  columnMap: Ref<ColumnMap>
  mappingOptions: Ref<MappingOptions>
  headers: Readonly<Ref<string[]>>
  sampleRows: ComputedRef<string[][]>
  canAdvance: ComputedRef<boolean>
  error: Readonly<Ref<string | null>>

  apply(): Promise<void>
}

export interface MappingPhaseOptions {
  rawRows: Ref<string[][]>
  rawHeaders: Ref<string[]>
  columnMap: Ref<ColumnMap>
  progress: ProgressTracker
  extractedEffectiveDate: Ref<string | null>
  extractedTitle: Ref<string | null>
  selectedParserId: Ref<string | null>
  preparedSheet: Ref<PreparedSheet | null>
  onMapped(entries: Partial<SeniorityEntry>[]): Promise<void>
  onMetadataReady(effectiveDate: string | null, title: string | null): void
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
  toValidatedEntries(): SeniorityEntry[]
  validate(): Promise<void>
}

export interface ReviewPhaseOptions {
  entries: Ref<Partial<SeniorityEntry>[]>
  rowErrors: ShallowRef<Map<number, string[]>>
  syntheticNote: Ref<string | null>
  syntheticIndices: Ref<Set<number>>
  progress: ProgressTracker
}

// ── Phase: Confirm ───────────────────────────────────────────────────────────

export interface ConfirmPhase {
  effectiveDate: Ref<DateValue | null>
  title: Ref<string>
  saving: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>

  save(entries: SeniorityEntry[]): Promise<number>
}

export interface ConfirmPhaseOptions {
  error: Ref<string | null>
}

// ── Public interface ─────────────────────────────────────────────────────────

export interface SeniorityUpload {
  selectedParserId: Ref<string | null>
  file: FilePhase
  mapping: MappingPhase
  review: ReviewPhase
  confirm: ConfirmPhase
  progress: ProgressTracker
  reset(): void
}
