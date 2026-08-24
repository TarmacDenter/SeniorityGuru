import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { EntryPredicate } from '~/utils/seniority-analysis/math'
import { qualificationKey } from './qualification-key'

export interface QualificationScope {
  readonly fleet?: string
  readonly seat?: string
  readonly base?: string
}

export const COMPANY_WIDE_QUALIFICATION_SCOPE: QualificationScope = {}

export function qualificationScopeToEntryPredicate(scope: QualificationScope): EntryPredicate {
  const { fleet, seat, base } = scope
  if (!fleet && !seat && !base) return () => true
  return entry =>
    (!fleet || entry.fleet === fleet)
    && (!seat || entry.seat === seat)
    && (!base || entry.base === base)
}

export function qualificationScopesEqual(a: QualificationScope, b: QualificationScope): boolean {
  return (a.fleet ?? undefined) === (b.fleet ?? undefined)
    && (a.seat ?? undefined) === (b.seat ?? undefined)
    && (a.base ?? undefined) === (b.base ?? undefined)
}

function scopeSortKey(scope: QualificationScope): string {
  return [scope.base, scope.seat, scope.fleet].filter(Boolean).join(' ')
}

export function enumerateQualificationScopes(entries: readonly SeniorityEntry[]): readonly QualificationScope[] {
  if (entries.length === 0) return [{}]

  const existingQualifications = new Set(entries.map(qualificationKey))
  const bases = [...new Set(entries.map(entry => entry.base))].sort()
  const seats = [...new Set(entries.map(entry => entry.seat))].sort()
  const fleets = [...new Set(entries.map(entry => entry.fleet))].sort()
  const scopes: QualificationScope[] = [{}]

  for (const base of bases) scopes.push({ base })
  for (const seat of seats) scopes.push({ seat })
  for (const fleet of fleets) scopes.push({ fleet })

  for (const base of bases) {
    for (const seat of seats) {
      if (entries.some(entry => entry.base === base && entry.seat === seat)) scopes.push({ base, seat })
    }
    for (const fleet of fleets) {
      if (entries.some(entry => entry.base === base && entry.fleet === fleet)) scopes.push({ base, fleet })
    }
  }
  for (const seat of seats) {
    for (const fleet of fleets) {
      if (entries.some(entry => entry.seat === seat && entry.fleet === fleet)) scopes.push({ seat, fleet })
    }
  }

  for (const key of existingQualifications) {
    const [base, seat, fleet] = key.split('|') as [string, string, string]
    scopes.push({ base, seat, fleet })
  }

  return [
    scopes[0]!,
    ...scopes.slice(1).sort((a, b) => {
      const dimensionsA = Number(!!a.base) + Number(!!a.seat) + Number(!!a.fleet)
      const dimensionsB = Number(!!b.base) + Number(!!b.seat) + Number(!!b.fleet)
      return dimensionsA - dimensionsB || scopeSortKey(a).localeCompare(scopeSortKey(b))
    }),
  ]
}
