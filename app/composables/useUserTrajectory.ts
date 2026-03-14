import type { Tables } from '#shared/types/database'
import {
  generateTimePoints,
  buildTrajectory,
  getProjectionEndDate,
  projectRetirements,
  projectComparativeTrajectory,
  type FilterFn,
} from '#shared/utils/seniority-math'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

type SeniorityEntry = Tables<'seniority_entries'>

export function useUserTrajectory() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  const userEntry = computed<SeniorityEntry | undefined>(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    return seniorityStore.entries.find((e) => e.employee_number === empNum)
  })

  const trajectoryData = computed(() => {
    const entry = userEntry.value
    if (!entry) {
      return { labels: [] as string[], data: [] as number[] }
    }
    const { today, endDate } = getProjectionEndDate(entry.retire_date)
    const timePoints = generateTimePoints(today, endDate)
    const trajectory = buildTrajectory(seniorityStore.entries, entry.seniority_number, timePoints)
    return {
      labels: trajectory.map((t) => t.date),
      data: trajectory.map((t) => t.percentile),
    }
  })

  function computeRetirementProjection(filterFn: FilterFn = () => true) {
    return projectRetirements(seniorityStore.entries, userEntry.value?.retire_date ?? null, filterFn)
  }

  function computeComparativeTrajectory(currentFilter: FilterFn, compareFilter: FilterFn) {
    const entry = userEntry.value
    if (!entry) return { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
    return projectComparativeTrajectory(seniorityStore.entries, entry.seniority_number, entry.retire_date, currentFilter, compareFilter)
  }

  return {
    trajectoryData,
    computeRetirementProjection,
    computeComparativeTrajectory,
  }
}
