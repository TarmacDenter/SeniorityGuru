import type { QualDemographicScale } from './seniority-engine/types'

const SEAT_ORDER: Record<string, number> = { CA: 0, FO: 1 }

/** Orders qualification display rows with captains before first officers. */
export function sortQualificationScales(scales: readonly QualDemographicScale[]): QualDemographicScale[] {
  return [...scales].sort((a, b) => {
    const seatDiff = (SEAT_ORDER[a.seat] ?? 99) - (SEAT_ORDER[b.seat] ?? 99)
    if (seatDiff !== 0) return seatDiff
    const fleetDiff = a.fleet.localeCompare(b.fleet)
    if (fleetDiff !== 0) return fleetDiff
    return a.plugPercentile - b.plugPercentile
  })
}
