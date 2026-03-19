import type { FilterFn } from '#shared/utils/seniority-math'
// TODO: once QualSpec is defined in seniority-engine/types.ts, this composable should:
//   1. Accept QualSpec[] instead of full Qual[] — derive partial qual options (fleet-only,
//      seat-only, base-only, base+fleet, fleet+seat, etc.) from the snapshot's unique dimension values
//   2. Replace the string-encoded scope options ("Fleet: 737", "CA/737/JFK") with structured
//      QualSpec objects so makeFilter() receives a QualSpec and calls qualSpecToFilter() instead
//      of parsing prefixed strings
//   3. Support arbitrary dimension combinations — currently base+fleet (e.g. "BOS 220") is missing
type Qual = { seat: string; fleet: string; base: string; label: string }

export function useScopeFilter(quals: Ref<Qual[]> | ComputedRef<Qual[]>) {
  const scopeOptions = computed(() => {
    const opts = ['Company-wide']

    const bases = new Set<string>()
    const seats = new Set<string>()
    const fleets = new Set<string>()
    for (const q of quals.value) {
      bases.add(q.base)
      seats.add(q.seat)
      fleets.add(q.fleet)
    }
    for (const base of Array.from(bases).sort()) opts.push(`Base: ${base}`)
    for (const seat of Array.from(seats).sort()) opts.push(`Seat: ${seat}`)
    for (const fleet of Array.from(fleets).sort()) opts.push(`Fleet: ${fleet}`)

    for (const q of quals.value) opts.push(q.label)

    return opts
  })

  function makeFilter(scope: string): FilterFn {
    if (!scope || scope === 'Company-wide') return () => true

    if (scope.startsWith('Base: ')) {
      const base = scope.replace('Base: ', '')
      return (e) => e.base === base
    }
    if (scope.startsWith('Seat: ')) {
      const seat = scope.replace('Seat: ', '')
      return (e) => e.seat === seat
    }
    if (scope.startsWith('Fleet: ')) {
      const fleet = scope.replace('Fleet: ', '')
      return (e) => e.fleet === fleet
    }

    const parts = scope.split('/')
    if (parts.length === 3) {
      const [seat, fleet, base] = parts
      return (e) => e.seat === seat && e.fleet === fleet && e.base === base
    }

    return () => true
  }

  return { scopeOptions, makeFilter }
}
