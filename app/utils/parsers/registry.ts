import type { PreParser } from './types'
import { genericParser } from './generic'

/** All registered pre-parsers. Specific parsers first, generic last. */
export const parsers: readonly PreParser[] = [genericParser]

/** Dropdown-ready options derived from registered parsers. */
export const parserOptions = parsers.map(p => ({
  label: p.label,
  value: p.id,
  description: p.description,
}))

/** Look up a parser by id. Returns generic if not found. */
export function getParser(id: string): PreParser {
  return parsers.find(p => p.id === id) ?? genericParser
}
