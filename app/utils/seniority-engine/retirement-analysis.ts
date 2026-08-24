import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { EntryPredicate, RetirementYearAnalysis } from './types'
import { extractYear } from '~/utils/date'

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
