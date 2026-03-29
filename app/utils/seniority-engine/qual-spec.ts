import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { FilterFn } from './types'
import { cellKey } from './cell-key'

export interface QualSpec {
  readonly fleet?: string
  readonly seat?: string
  readonly base?: string
}

export const COMPANY_WIDE: QualSpec = {}

export function qualSpecToFilter(spec: QualSpec): FilterFn {
  const { fleet, seat, base } = spec
  if (!fleet && !seat && !base) return () => true
  return (e) => {
    if (fleet && e.fleet !== fleet) return false
    if (seat && e.seat !== seat) return false
    if (base && e.base !== base) return false
    return true
  }
}

export function qualSpecLabel(spec: QualSpec): string {
  const parts: string[] = []
  if (spec.base) parts.push(spec.base)
  if (spec.seat) parts.push(spec.seat)
  if (spec.fleet) parts.push(spec.fleet)
  return parts.length === 0 ? 'Company-wide' : parts.join(' ')
}

export function qualSpecEquals(a: QualSpec, b: QualSpec): boolean {
  return (a.fleet ?? undefined) === (b.fleet ?? undefined)
    && (a.seat ?? undefined) === (b.seat ?? undefined)
    && (a.base ?? undefined) === (b.base ?? undefined)
}

export function enumerateQualSpecs(entries: readonly SeniorityEntry[]): QualSpec[] {
  if (entries.length === 0) return [{}]

  const existingCombos = new Set<string>()
  for (const e of entries) {
    existingCombos.add(cellKey(e))
  }

  const bases = [...new Set(entries.map(e => e.base))].sort()
  const seats = [...new Set(entries.map(e => e.seat))].sort()
  const fleets = [...new Set(entries.map(e => e.fleet))].sort()

  const specs: QualSpec[] = [{}]

  for (const base of bases) specs.push({ base })
  for (const seat of seats) specs.push({ seat })
  for (const fleet of fleets) specs.push({ fleet })

  for (const base of bases) {
    for (const seat of seats) {
      if (entries.some(e => e.base === base && e.seat === seat)) {
        specs.push({ base, seat })
      }
    }
    for (const fleet of fleets) {
      if (entries.some(e => e.base === base && e.fleet === fleet)) {
        specs.push({ base, fleet })
      }
    }
  }
  for (const seat of seats) {
    for (const fleet of fleets) {
      if (entries.some(e => e.seat === seat && e.fleet === fleet)) {
        specs.push({ seat, fleet })
      }
    }
  }

  for (const combo of existingCombos) {
    const [base, seat, fleet] = combo.split('|') as [string, string, string]
    specs.push({ base, seat, fleet })
  }

  const companyWide = specs[0]!
  const rest = specs.slice(1).sort((a, b) => {
    const dimA = (a.base ? 1 : 0) + (a.seat ? 1 : 0) + (a.fleet ? 1 : 0)
    const dimB = (b.base ? 1 : 0) + (b.seat ? 1 : 0) + (b.fleet ? 1 : 0)
    if (dimA !== dimB) return dimA - dimB
    return qualSpecLabel(a).localeCompare(qualSpecLabel(b))
  })

  return [companyWide, ...rest]
}
