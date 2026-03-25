export interface PreParserMetadata {
  effectiveDate: string | null
  title: string | null
  /** Number of rows where the parser had to synthesize missing data. */
  syntheticCount?: number
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
