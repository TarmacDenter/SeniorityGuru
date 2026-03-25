export interface PreParserMetadata {
  effectiveDate: string | null
  title: string | null
  /** Data row indices (0-based) where the parser synthesized missing data. */
  syntheticIndices?: number[]
  /** Human-readable description of what was synthesized. */
  syntheticNote?: string
}

export interface PreParserResult {
  rows: string[][]
  metadata: PreParserMetadata
}

export interface PreParser {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly icon: string
  readonly formatDescription: string
  parse(raw: string[][]): PreParserResult
}
