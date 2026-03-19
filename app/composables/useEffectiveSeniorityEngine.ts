import type { SenioritySnapshot, SeniorityLens, PilotAnchor } from '#shared/utils/seniority-engine'
import { createSnapshot, createLens } from '#shared/utils/seniority-engine'
import { useSeniorityStore } from '~/stores/seniority'
import { useSeniorityEngine } from './useSeniorityEngine'
import { useNewHireMode } from './useNewHireMode'

/**
 * Sits above useSeniorityEngine and handles the mode switch:
 *   - Employee ID mode → delegates to the pure engine
 *   - New Hire mode → builds an augmented snapshot with the synthetic entry
 *
 * useSeniorityEngine stays pure; new-hire logic never crosses into the engine.
 */
export function useEffectiveSeniorityEngine() {
  const seniorityStore = useSeniorityStore()
  const { snapshot: baseSnapshot, lens: baseLens } = useSeniorityEngine()
  const newHireMode = useNewHireMode()

  const snapshot = computed<SenioritySnapshot | null>(() => {
    const synthetic = newHireMode.syntheticEntry.value
    if (!synthetic) return baseSnapshot.value
    if (seniorityStore.entries.length === 0) return null
    return createSnapshot([...seniorityStore.entries, synthetic])
  })

  const lens = computed<SeniorityLens | null>(() => {
    const synthetic = newHireMode.syntheticEntry.value
    if (!snapshot.value || !synthetic) return baseLens.value
    const anchor: PilotAnchor = {
      seniorityNumber: synthetic.seniority_number,
      retireDate: synthetic.retire_date,
      employeeNumber: synthetic.employee_number,
    }
    return createLens(snapshot.value, anchor)
  })

  return { snapshot, lens }
}
