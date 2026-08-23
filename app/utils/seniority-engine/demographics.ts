import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type {
  AgeBucket,
  CaptainQualificationThreshold,
  QualificationComposition,
  YearsOfServiceBucket,
  YearsOfServiceDistribution,
} from './types'
import type { EntryPredicate } from '~/utils/seniority-analysis/math'
import { qualificationKey } from './qualification-key'
import { percentileValue } from './percentile-value'
import { computeYOSDate } from '~/utils/date'
import type { PlainDate } from '~/utils/temporal'

const AGE_BUCKETS: readonly { minimumAge: number; maximumAge?: number }[] = [
  { minimumAge: 0, maximumAge: 29 },
  { minimumAge: 30, maximumAge: 34 },
  { minimumAge: 35, maximumAge: 39 },
  { minimumAge: 40, maximumAge: 44 },
  { minimumAge: 45, maximumAge: 49 },
  { minimumAge: 50, maximumAge: 54 },
  { minimumAge: 55, maximumAge: 59 },
  { minimumAge: 60, maximumAge: 64 },
  { minimumAge: 65 },
]

export function analyzeAgeDistribution(
  entries: readonly SeniorityEntry[],
  mandatoryRetirementAge: number,
  predicate: EntryPredicate | undefined,
  asOfDate: PlainDate,
): { readonly buckets: readonly AgeBucket[]; readonly unknownAgePilotCount: number } {
  const scopedEntries = predicate ? entries.filter(predicate) : entries
  const counts = new Array<number>(AGE_BUCKETS.length).fill(0)
  let unknownAgePilotCount = 0
  for (const entry of scopedEntries) {
    if (!entry.retire_date) {
      unknownAgePilotCount++
      continue
    }
    const age = Math.floor(computeYOSDate(entry.retire_date.subtract({ years: mandatoryRetirementAge }), asOfDate))
    const index = AGE_BUCKETS.findIndex(bucket =>
      age >= bucket.minimumAge && (bucket.maximumAge === undefined || age <= bucket.maximumAge),
    )
    if (index >= 0) counts[index] = counts[index]! + 1
  }
  return {
    buckets: AGE_BUCKETS.map((bucket, index) => ({ ...bucket, pilotCount: counts[index]! })),
    unknownAgePilotCount,
  }
}

export function findCaptainQualificationThresholds(
  entries: readonly SeniorityEntry[],
  asOfDate: PlainDate,
): readonly CaptainQualificationThreshold[] {
  const byQualification = new Map<string, SeniorityEntry>()
  for (const entry of entries) {
    if (entry.seat !== 'CA') continue
    const key = qualificationKey(entry)
    const existing = byQualification.get(key)
    if (!existing || entry.seniority_number > existing.seniority_number) byQualification.set(key, entry)
  }
  return Array.from(byQualification.values()).map(entry => ({
    qualification: { base: entry.base, seat: entry.seat, fleet: entry.fleet },
    seniorityNumber: entry.seniority_number,
    hireDate: entry.hire_date,
    yearsOfService: computeYOSDate(entry.hire_date, asOfDate),
  })).sort((a, b) => qualificationKey(a.qualification).localeCompare(qualificationKey(b.qualification)))
}

export function analyzeYearsOfServiceBuckets(
  entries: readonly SeniorityEntry[],
  predicate: EntryPredicate | undefined,
  asOfDate: PlainDate,
): readonly YearsOfServiceBucket[] {
  const scopedEntries = predicate ? entries.filter(predicate) : entries
  if (scopedEntries.length === 0) return []
  const values = scopedEntries.map(entry => computeYOSDate(entry.hire_date, asOfDate))
  const counts = new Array<number>(Math.max(Math.ceil(Math.max(...values)) + 1, 1)).fill(0)
  for (const years of values) {
    const index = Math.min(Math.floor(years), counts.length - 1)
    counts[index] = counts[index]! + 1
  }
  return counts.map((pilotCount, minimumYears) => ({
    minimumYears,
    maximumYears: minimumYears + 1,
    pilotCount,
  }))
}

export function analyzeYearsOfServiceDistribution(
  entries: readonly SeniorityEntry[],
  predicate: EntryPredicate | undefined,
  asOfDate: PlainDate,
): YearsOfServiceDistribution {
  const scopedEntries = predicate ? entries.filter(predicate) : entries
  if (scopedEntries.length === 0) {
    return { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, maximum: 0 }
  }
  const sorted = scopedEntries.map(entry => computeYOSDate(entry.hire_date, asOfDate)).sort((a, b) => a - b)
  const mostJunior = scopedEntries.reduce((current, entry) =>
    current.seniority_number > entry.seniority_number ? current : entry,
  )
  return {
    entryFloor: computeYOSDate(mostJunior.hire_date, asOfDate),
    p10: percentileValue(sorted, 10),
    p25: percentileValue(sorted, 25),
    median: percentileValue(sorted, 50),
    p75: percentileValue(sorted, 75),
    p90: percentileValue(sorted, 90),
    maximum: sorted.at(-1)!,
  }
}

export function analyzeQualificationComposition(entries: readonly SeniorityEntry[]): readonly QualificationComposition[] {
  const byFleetAndSeat = new Map<string, SeniorityEntry[]>()
  for (const entry of entries) {
    const key = `${entry.fleet}|${entry.seat}`
    const group = byFleetAndSeat.get(key) ?? []
    group.push(entry)
    byFleetAndSeat.set(key, group)
  }
  return Array.from(byFleetAndSeat.values()).map((group) => {
    const { fleet, seat } = group[0]!
    const baseCounts = new Map<string, number>()
    for (const entry of group) baseCounts.set(entry.base, (baseCounts.get(entry.base) ?? 0) + 1)
    const pilotCount = group.length
    const captainCount = group.filter(entry => entry.seat === 'CA').length
    const firstOfficerCount = group.filter(entry => entry.seat === 'FO').length
    return {
      fleet,
      seat,
      pilotCount,
      captainCount,
      firstOfficerCount,
      captainToFirstOfficerRatio: Math.round((captainCount / Math.max(firstOfficerCount, 1)) * 100) / 100,
      byBase: Array.from(baseCounts.entries())
        .map(([base, count]) => ({
          base,
          pilotCount: count,
          percentage: Math.round((count / pilotCount) * 1000) / 10,
        }))
        .sort((a, b) => b.pilotCount - a.pilotCount),
    }
  })
}
