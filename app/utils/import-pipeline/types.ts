import type { ImportField, MappingSelection } from './fields'
import type { SeniorityEntry } from '../schemas/seniority-list'

/** A decoded spreadsheet value retained by the import pipeline. */
export type SourceCellValue = string | number | boolean | null

/** A stable source column identity and its decoded header label. */
export interface SourceColumn {
  readonly id: string
  readonly label: string | null
}

/** A stable source row identity and its lossless decoded cell values. */
export interface SourceRow {
  readonly id: string
  readonly cells: readonly SourceCellValue[]
}

/** A lossless, library-independent representation of one decoded worksheet. */
export interface SourceSheet {
  readonly id: string
  readonly name: string
  readonly columns: readonly SourceColumn[]
  readonly rows: readonly SourceRow[]
}

/** A workbook decoded without retaining workbook-library objects or formatting. */
export interface DecodedWorkbook {
  readonly sheetNames: readonly string[]
  readonly sheets: readonly SourceSheet[]
}

/** A user-facing, actionable workbook decoding failure. */
export interface DecodeError {
  readonly kind: 'file-read-failed' | 'workbook-decode-failed' | 'no-sheets'
  readonly message: string
}

export type DecodeWorkbookResult =
  | { readonly ok: true; readonly workbook: DecodedWorkbook }
  | { readonly ok: false; readonly error: DecodeError }

export type { ImportField } from './fields'
export type { MappingSelection } from './fields'

/** A canonical or derived column exposed during Match Columns. */
export interface PreparedColumn {
  readonly id: string
  readonly label: string
  readonly sourceColumnId?: string
}

/** One lossless prepared row. Excluded rows remain available through sourceSheet. */
export interface PreparedRow {
  readonly sourceRowId: string
  /** A non-destructive data-row suggestion. Excluded rows remain available for recovery. */
  readonly included?: boolean
  readonly cells: Readonly<Record<string, SourceCellValue>>
}

/** A lossless sheet plus plugin-prepared columns and row values. */
export interface PreparedSheet {
  readonly sourceSheet: SourceSheet
  readonly columns: readonly PreparedColumn[]
  readonly rows: readonly PreparedRow[]
}

/** A typed issue that can be shown in preparation, mapping, or Review. */
export interface ImportIssue {
  readonly kind: 'ambiguous-alias' | 'preparation-failed' | 'transformation-failed' | 'validation-failed'
  readonly field?: ImportField
  readonly message: string
}

/** The only changes a plugin may make while preparing a sheet. */
export interface PreparationPatch {
  readonly columns?: readonly PreparedColumn[]
  /** Values for derived prepared columns, keyed by prepared column and source row ID. */
  readonly cellValues?: Readonly<Record<string, Readonly<Record<string, SourceCellValue>>>>
  readonly mappingSuggestions?: Readonly<Partial<Record<ImportField, string>>>
  readonly issues?: readonly ImportIssue[]
  readonly metadata?: { readonly effectiveDate?: string, readonly title?: string }
  /** Source row IDs that are data-free and should not become draft entries. */
  readonly excludedSourceRowIds?: readonly string[]
}

/**
 * The compiled-in contribution contract for one explicit Upload Type.
 *
 * Plugins are synchronous and pure. They receive immutable pipeline data,
 * return validated patches, and never access Vue, browser services,
 * persistence, logging, network services, or another plugin.
 */
export interface ImportPlugin {
  /** Permanent lowercase slug used by preferences and diagnostics. */
  readonly id: string
  /** User-facing Upload Type name. */
  readonly label: string
  /** Short explanation shown when the Upload Type is selected. */
  readonly description: string
  /** Nuxt UI icon name for the Upload Type. */
  readonly icon: string
  /** Human-readable description of accepted spreadsheet formats. */
  readonly formatDescription: string
  /** Fields that must be mapped before this Upload Type can continue. */
  readonly requiredMappings?: readonly ImportField[]
  /** Suggests a heading row without changing the source sheet. */
  readonly suggestHeaderRow?: (sourceSheet: SourceSheet) => number | undefined
  /** Returns immutable preparation changes; it must not mutate sourceSheet. */
  readonly prepare: (sourceSheet: SourceSheet) => PreparationPatch
  /** Returns an immutable mapped-entry patch; it must not mutate either input. */
  readonly transformMappedEntry?: (input: MappedEntryTransformationInput) => EntryPatch
}

export interface PrepareImportResult {
  readonly preparedSheet: PreparedSheet
  readonly patch: PreparationPatch
  readonly mappingSuggestions: Readonly<Partial<Record<ImportField, string>>>
  readonly issues: readonly ImportIssue[]
  readonly metadata: { readonly effectiveDate: string | null, readonly title: string | null }
}

/** The user-confirmed mapping choices passed to the processing operation. */
export type ConfirmedMappings = Readonly<Partial<Record<ImportField, MappingSelection>>>

/** A mapped, transformed, and validated row ready for Review. */
export interface DraftSeniorityEntry {
  readonly id: string
  readonly sourceRowId: string
  readonly entry: Readonly<Partial<SeniorityEntry>>
  readonly issues: readonly ImportIssue[]
}

/** Immutable context supplied to a plugin's mapped-entry transformation. */
export interface MappedEntryTransformationInput {
  readonly draft: DraftSeniorityEntry
  readonly preparedRow: PreparedRow
}

/** The only changes a plugin may make to a mapped entry. */
export interface EntryPatch {
  readonly entry?: Readonly<Partial<SeniorityEntry>>
  readonly issues?: readonly ImportIssue[]
}

/** Public result of processing confirmed mappings. */
export interface ProcessConfirmedMappingsResult {
  readonly drafts: readonly DraftSeniorityEntry[]
  readonly issues: readonly ImportIssue[]
  readonly diagnostics: {
    readonly includedRowCount: number
    readonly issueCount: number
  }
}

/** Durable, stage-by-stage record exported when an Upload Type needs diagnosis. */
export interface ImportDiagnosticTrace {
  readonly diagnosticSchemaVersion: 3
  readonly appBuildVersion: string
  readonly plugin: { readonly id: string, readonly label: string }
  readonly file: { readonly name: string }
  readonly createdAt: string
  readonly updatedAt?: string
  readonly stage: 'reading' | 'prepared' | 'mapped' | 'review' | 'completed'
  readonly outcome: 'review' | 'saved' | 'failed'
  readonly error?: string
  readonly sourceSheet?: SourceSheet
  readonly preparation?: {
    readonly headerRowIndex: number
    readonly patch: PreparationPatch
    readonly preparedSheet: PreparedSheet
    readonly issues: readonly ImportIssue[]
    readonly metadata: { readonly effectiveDate: string | null, readonly title: string | null }
  }
  readonly mapping?: {
    readonly confirmedMappings: ConfirmedMappings
    readonly processedDrafts: readonly DraftSeniorityEntry[]
    readonly transformationIssues: readonly ImportIssue[]
  }
  readonly validation?: { readonly rowErrors: Readonly<Record<string, readonly string[]>> }
  readonly review?: {
    readonly editPatches: readonly ReviewEditPatch[]
  }
  readonly final?: {
    readonly entries: readonly unknown[]
    readonly outcome: 'saved' | 'failed'
    readonly savedListId?: number
    readonly completedAt: string
  }
}

export interface ReviewEditPatch {
  readonly action: 'update-cell' | 'delete-row' | 'insert-row' | 'delete-error-rows'
  readonly entries: readonly Partial<Record<string, unknown>>[]
  readonly at: string
}
