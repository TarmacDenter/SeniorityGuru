import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type {
  EntryPredicate,
  QualificationScope,
  RetirementHeatmap,
  RetirementHeatmapDimension,
  RetirementHeatmapRow,
  RetirementYearAnalysis,
} from './types'
import { Temporal, type PlainDate } from '~/utils/temporal'
import { extractYear, isRetiredBy } from '~/utils/date'

export function analyzeRetirementYears(entries: readonly SeniorityEntry[], predicate?: EntryPredicate): readonly RetirementYearAnalysis[] {
  const filtered = predicate ? entries.filter(predicate) : entries
  const countByYear = new Map<number, number>()
  for (const entry of filtered) {
    if (entry.retire_date) countByYear.set(extractYear(entry.retire_date), (countByYear.get(extractYear(entry.retire_date)) ?? 0) + 1)
  }
  if (countByYear.size === 0) return []
  const counts = Array.from(countByYear.values())
  const waveThreshold = (counts.reduce((sum, count) => sum + count, 0) / counts.length) * 1.5
  return Array.from(countByYear.entries()).sort(([a], [b]) => a - b).map(([year, retirementCount]) => ({
    year,
    retirementCount,
    isRetirementWave: retirementCount >= waveThreshold,
  }))
}

export function findLatestRetirementDate(entries: readonly SeniorityEntry[]): PlainDate | null {
  return entries.reduce<PlainDate | null>((latest, entry) =>
    entry.retire_date && (!latest || Temporal.PlainDate.compare(entry.retire_date, latest) > 0) ? entry.retire_date : latest, null)
}

const HEATMAP_DIMENSION_ORDER: readonly RetirementHeatmapDimension[] = ['base', 'seat', 'fleet']

/**
 * Scheduled retirements of active pilots, one row per group of the chosen dimensions and one column per year
 * from the As-of Date's year. Pilots retired by the As-of Date are left out, as they are from Rank.
 */
export function analyzeRetirementHeatmap(
  entries: readonly SeniorityEntry[],
  options: { groupBy: readonly RetirementHeatmapDimension[]; predicate?: EntryPredicate; asOfDate: PlainDate },
): RetirementHeatmap {
  const dimensions = HEATMAP_DIMENSION_ORDER.filter(dimension => options.groupBy.includes(dimension))
  const active = entries.filter(entry =>
    (!options.predicate || options.predicate(entry))
    && !(entry.retire_date && isRetiredBy(entry.retire_date, options.asOfDate)))

  const firstYear = options.asOfDate.year
  const lastYear = active.reduce((last, entry) => entry.retire_date ? Math.max(last, extractYear(entry.retire_date)) : last, firstYear - 1)
  const years = Array.from({ length: Math.max(0, lastYear - firstYear + 1) }, (_, index) => firstYear + index)

  const groups = new Map<string, { group: QualificationScope; activePilotCount: number; retirementCounts: number[] }>()
  let undatedPilotCount = 0
  for (const entry of active) {
    const key = dimensions.map(dimension => entry[dimension]).join('\u0000')
    let group = groups.get(key)
    if (!group) {
      group = {
        group: Object.fromEntries(dimensions.map(dimension => [dimension, entry[dimension]])) as QualificationScope,
        activePilotCount: 0,
        retirementCounts: years.map(() => 0),
      }
      groups.set(key, group)
    }
    group.activePilotCount += 1
    if (entry.retire_date) group.retirementCounts[extractYear(entry.retire_date) - firstYear]! += 1
    else undatedPilotCount += 1
  }

  const rows: RetirementHeatmapRow[] = Array.from(groups.values(), group => ({
    ...group,
    totalRetirementCount: group.retirementCounts.reduce((sum, count) => sum + count, 0),
  }))
  const maxRetirementCount = rows.reduce((max, row) => Math.max(max, ...row.retirementCounts), 0)
  return { years, rows, maxRetirementCount, undatedPilotCount }
}
