import {
  generateTimePoints,
  buildTrajectory,
  getProjectionEndDate,
  projectRetirements,
  projectComparativeTrajectory,
  computeTrajectoryDeltas,
  type FilterFn,
} from '#shared/utils/seniority-math'
import { DEFAULT_GROWTH_CONFIG, type GrowthConfig } from '#shared/types/growth-config'
import type { Ref } from 'vue'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserEntry } from './useUserEntry'

export function useUserTrajectory(growthConfig: Ref<GrowthConfig> = ref({ ...DEFAULT_GROWTH_CONFIG })) {
  const seniorityStore = useSeniorityStore()
  const userEntry = useUserEntry({ withNewHireMode: true })

  const fullTrajectory = computed(() => {
    const entry = userEntry.value
    if (!entry) return []
    const { today, endDate } = getProjectionEndDate(entry.retire_date)
    const timePoints = generateTimePoints(today, endDate)
    return buildTrajectory(seniorityStore.entries, entry.seniority_number, timePoints, undefined, growthConfig.value)
  })

  const trajectoryChartData = computed(() => {
    const trajectory = fullTrajectory.value
    if (trajectory.length === 0) {
      return { labels: [] as string[], data: [] as number[] }
    }
    return {
      labels: trajectory.map((t) => t.date),
      data: trajectory.map((t) => t.percentile),
    }
  })

  const trajectoryDeltas = computed(() => computeTrajectoryDeltas(fullTrajectory.value))

  function computeRetirementProjection(filterFn: FilterFn = () => true) {
    return projectRetirements(seniorityStore.entries, userEntry.value?.retire_date ?? null, filterFn)
  }

  function computeComparativeTrajectory(currentFilter: FilterFn, compareFilter: FilterFn) {
    const entry = userEntry.value
    if (!entry) return { labels: [] as string[], currentData: [] as number[], compareData: [] as number[] }
    return projectComparativeTrajectory(seniorityStore.entries, entry.seniority_number, entry.retire_date, currentFilter, compareFilter, growthConfig.value)
  }

  return {
    fullTrajectory,
    trajectoryChartData,
    trajectoryDeltas,
    computeRetirementProjection,
    computeComparativeTrajectory,
  }
}
