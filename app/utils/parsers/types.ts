export interface PreParserMetadata {
  effectiveDate: string | null
  title: string | null
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
