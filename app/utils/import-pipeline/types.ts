/** A decoded spreadsheet value retained by the import pipeline. */
export type SourceCellValue = string | number | boolean | null

export interface SourceColumn {
  readonly id: string
  readonly label: string | null
}

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

export interface DecodedWorkbook {
  readonly sheetNames: readonly string[]
  readonly sheets: readonly SourceSheet[]
}

export interface DecodeError {
  readonly kind: 'file-read-failed' | 'workbook-decode-failed' | 'no-sheets'
  readonly message: string
}

export type DecodeWorkbookResult =
  | { readonly ok: true; readonly workbook: DecodedWorkbook }
  | { readonly ok: false; readonly error: DecodeError }

export type ImportField =
  | 'seniority_number'
  | 'employee_number'
  | 'name'
  | 'seat'
  | 'base'
  | 'fleet'
  | 'hire_date'
  | 'retire_date'

export interface PreparedColumn {
  readonly id: string
  readonly label: string
  readonly sourceColumnId?: string
}

export interface PreparedRow {
  readonly sourceRowId: string
  /** A non-destructive data-row suggestion. Excluded rows remain available for recovery. */
  readonly included?: boolean
  readonly cells: Readonly<Record<string, SourceCellValue>>
}

export interface PreparedSheet {
  readonly sourceSheet: SourceSheet
  readonly columns: readonly PreparedColumn[]
  readonly rows: readonly PreparedRow[]
}

export interface ImportIssue {
  readonly kind: 'ambiguous-alias' | 'preparation-failed' | 'transformation-failed' | 'validation-failed'
  readonly field?: ImportField
  readonly message: string
}

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

export interface ImportPlugin {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly icon: string
  readonly formatDescription: string
  readonly requiredMappings?: readonly ImportField[]
  /** Returns the source row that should provide headings, when the format has a preamble. */
  readonly suggestHeaderRow?: (sourceSheet: SourceSheet) => number | undefined
  readonly prepare: (sourceSheet: SourceSheet) => PreparationPatch
  readonly transformMappedEntry?: (input: MappedEntryTransformationInput) => EntryPatch
}

export interface PrepareImportResult {
  readonly preparedSheet: PreparedSheet
  readonly mappingSuggestions: Readonly<Partial<Record<ImportField, string>>>
  readonly issues: readonly ImportIssue[]
  readonly metadata: { readonly effectiveDate: string | null, readonly title: string | null }
}

export type MappingSelection =
  | { readonly kind: 'column'; readonly columnId: string }
  | { readonly kind: 'combined-name'; readonly firstNameColumnId: string; readonly lastNameColumnId: string }
  | { readonly kind: 'retirement-from-birth-date'; readonly columnId: string; readonly retirementAge: number }

export type ConfirmedMappings = Readonly<Partial<Record<ImportField, MappingSelection>>>

export interface DraftSeniorityEntry {
  readonly id: string
  readonly sourceRowId: string
  readonly entry: Readonly<Record<string, unknown>>
  readonly issues: readonly ImportIssue[]
}

export interface MappedEntryTransformationInput {
  readonly draft: DraftSeniorityEntry
  readonly preparedRow: PreparedRow
}

export interface EntryPatch {
  readonly entry?: Readonly<Partial<Record<string, unknown>>>
  readonly issues?: readonly ImportIssue[]
}

export interface ProcessConfirmedMappingsResult {
  readonly drafts: readonly DraftSeniorityEntry[]
  readonly issues: readonly ImportIssue[]
  readonly diagnostics: {
    readonly includedRowCount: number
    readonly issueCount: number
  }
}
