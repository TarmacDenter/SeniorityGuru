import type { PresentedQualificationPosition } from './seniority'

const SEAT_ORDER: Record<string, number> = { CA: 0, FO: 1 }

/** Orders qualification display rows with captains before first officers. */
export function sortQualificationPositions(positions: readonly PresentedQualificationPosition[]): PresentedQualificationPosition[] {
  return [...positions].sort((a, b) => {
    const seatDiff = (SEAT_ORDER[a.qualification.seat] ?? 99) - (SEAT_ORDER[b.qualification.seat] ?? 99)
    if (seatDiff !== 0) return seatDiff
    const fleetDiff = a.qualification.fleet.localeCompare(b.qualification.fleet)
    if (fleetDiff !== 0) return fleetDiff
    return a.thresholdPercentile - b.thresholdPercentile
  })
}
