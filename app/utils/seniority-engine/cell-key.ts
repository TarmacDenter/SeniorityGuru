/**
 * Canonical cell key for grouping entries by base/seat/fleet.
 * Used by snapshot, qualification-position, and qual-spec to ensure consistent grouping.
 */
export function cellKey(entry: { base: string; seat: string; fleet: string }): string {
  return `${entry.base}|${entry.seat}|${entry.fleet}`
}
