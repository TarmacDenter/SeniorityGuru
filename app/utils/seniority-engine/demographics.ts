import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type {
  AgeBucket,
  FilterFn,
  MostJuniorCARow,
  QualCompositionRow,
  YosDistribution,
  YosHistogramBucket,
} from './types'
import { cellKey } from './cell-key'
import { computeYOSDate } from '~/utils/date'
import type { PlainDate } from '~/utils/temporal'

export function qualKey(entry: SeniorityEntry): string {
  return `${entry.fleet} ${entry.seat}`
}

const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '< 30', min: 0, max: 29 }, { label: '30–34', min: 30, max: 34 },
  { label: '35–39', min: 35, max: 39 }, { label: '40–44', min: 40, max: 44 },
  { label: '45–49', min: 45, max: 49 }, { label: '50–54', min: 50, max: 54 },
  { label: '55–59', min: 55, max: 59 }, { label: '60–64', min: 60, max: 64 },
  { label: '65+', min: 65, max: Infinity },
]

export function computeAgeDistribution(entries: readonly SeniorityEntry[], mandatoryAge: number, filterFn: FilterFn | undefined, asOfDate: PlainDate): { buckets: AgeBucket[]; nullCount: number } {
  const filtered = filterFn ? entries.filter(filterFn) : entries
  const counts = new Array<number>(AGE_BUCKETS.length).fill(0)
  let nullCount = 0
  for (const entry of filtered) {
    if (!entry.retire_date) { nullCount++; continue }
    const age = Math.floor(computeYOSDate(entry.retire_date.subtract({ years: mandatoryAge }), asOfDate))
    const index = AGE_BUCKETS.findIndex(bucket => age >= bucket.min && age <= bucket.max)
    if (index >= 0) counts[index]!++
  }
  return { buckets: AGE_BUCKETS.map((bucket, index) => ({ label: bucket.label, count: counts[index]! })), nullCount }
}

export function findMostJuniorCA(entries: readonly SeniorityEntry[], asOfDate: PlainDate): MostJuniorCARow[] {
  const byQual = new Map<string, SeniorityEntry>()
  for (const entry of entries) {
    if (entry.seat !== 'CA') continue
    const key = cellKey(entry)
    const existing = byQual.get(key)
    if (!existing || entry.seniority_number > existing.seniority_number) byQual.set(key, entry)
  }
  return Array.from(byQual.values()).map(entry => ({
    qualKey: `${entry.fleet} ${entry.seat} ${entry.base}`,
    fleet: entry.fleet, seat: entry.seat, base: entry.base,
    seniorityNumber: entry.seniority_number, hireDate: entry.hire_date,
    yos: computeYOSDate(entry.hire_date, asOfDate),
  })).sort((a, b) => a.qualKey.localeCompare(b.qualKey))
}

export function computeYosHistogram(entries: readonly SeniorityEntry[], filterFn: FilterFn | undefined, asOfDate: PlainDate): YosHistogramBucket[] {
  const filtered = filterFn ? entries.filter(filterFn) : entries
  if (filtered.length === 0) return []
  const yosValues = filtered.map(entry => computeYOSDate(entry.hire_date, asOfDate))
  const bucketCount = Math.max(Math.ceil(Math.max(...yosValues)) + 1, 1)
  const counts = new Array<number>(bucketCount).fill(0)
  for (const yos of yosValues) counts[Math.min(Math.floor(yos), bucketCount - 1)]!++
  return counts.map((count, index) => ({ label: String(index), minYos: index, count }))
}

function percentileOf(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0
  return sorted[Math.floor((percentile / 100) * (sorted.length - 1))]!
}

export function computeYosDistribution(entries: readonly SeniorityEntry[], filterFn: FilterFn | undefined, asOfDate: PlainDate): YosDistribution {
  const filtered = filterFn ? entries.filter(filterFn) : entries
  if (filtered.length === 0) return { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 }
  const sorted = filtered.map(entry => computeYOSDate(entry.hire_date, asOfDate)).sort((a, b) => a - b)
  const mostJunior = filtered.reduce((first, entry) => first.seniority_number > entry.seniority_number ? first : entry)
  return { entryFloor: computeYOSDate(mostJunior.hire_date, asOfDate), p10: percentileOf(sorted, 10), p25: percentileOf(sorted, 25), median: percentileOf(sorted, 50), p75: percentileOf(sorted, 75), p90: percentileOf(sorted, 90), max: sorted[sorted.length - 1]! }
}

export function computeQualComposition(entries: readonly SeniorityEntry[]): QualCompositionRow[] {
  const byQual = new Map<string, SeniorityEntry[]>()
  for (const entry of entries) {
    const key = qualKey(entry)
    const group = byQual.get(key) ?? []
    group.push(entry)
    byQual.set(key, group)
  }
  return Array.from(byQual.entries()).map(([key, group]) => {
    const { fleet, seat } = group[0]!
    const baseCounts = new Map<string, number>()
    for (const entry of group) baseCounts.set(entry.base, (baseCounts.get(entry.base) ?? 0) + 1)
    const total = group.length
    const caCount = group.filter(entry => entry.seat === 'CA').length
    const foCount = group.filter(entry => entry.seat === 'FO').length
    return { qualKey: key, fleet, seat, total, caCount, foCount, caFoRatio: Math.round((caCount / Math.max(foCount, 1)) * 100) / 100, byBase: Array.from(baseCounts.entries()).map(([base, count]) => ({ base, count, pct: Math.round((count / total) * 1000) / 10 })).sort((a, b) => b.count - a.count) }
  })
}
