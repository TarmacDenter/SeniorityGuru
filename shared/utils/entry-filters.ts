import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'

export function uniqueEntryValues(
  entries: SeniorityEntryResponse[],
  field: 'fleet' | 'seat' | 'base',
): string[] {
  const values = new Set<string>()
  for (const e of entries) {
    const v = e[field]
    if (v) values.add(v)
  }
  return Array.from(values).sort()
}
