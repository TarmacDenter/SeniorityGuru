<template>
  <div class="p-4 sm:p-6 space-y-6">
    <!-- Projection controls -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <USwitch v-model="usePositionProjection" />
        <span class="text-sm text-[var(--ui-text-muted)]">Project forward</span>
      </div>
      <template v-if="usePositionProjection">
        <USlider
          v-model="positionYearsInput"
          :min="1"
          :max="positionSliderMax"
          :step="1"
          class="w-48"
        />
        <UBadge color="neutral" variant="subtle" size="sm" class="font-mono">
          +{{ positionYearsInput }}yr{{ positionYearsInput === 1 ? '' : 's' }}
        </UBadge>
      </template>
      <UBadge v-else color="neutral" variant="subtle" size="sm">As of today</UBadge>
    </div>

    <!-- Qual Seniority Scale -->
    <UCard v-if="projections.qualScales.value.length > 0">
      <template #header>
        <h3 class="font-semibold">Seniority Position by Qual</h3>
      </template>
      <AnalyticsQualSeniorityScale :scales="projections.qualScales.value" />
    </UCard>

    <UAlert
      v-else-if="!hasEmployeeNumber"
      icon="i-lucide-user-search"
      color="warning"
      variant="subtle"
      title="Employee Number Required"
      description="Set your employee number in Settings to see your position across quals."
    />

    <!-- Base/Seat Status Table -->
    <DashboardBaseStatusTable v-if="userFound" :data="baseStatusData" />

    <!-- Aggregate Stats -->
    <DashboardAggregateStatsGrid :data="aggregateStats" />
  </div>
</template>

<script setup lang="ts">
import { useQualProjections } from '~/composables/useQualProjections'
import { useDashboardStats } from '~/composables/useDashboardStats'

const projections = useQualProjections()

const { hasEmployeeNumber, userFound, baseStatusData, aggregateStats } = useDashboardStats()

const usePositionProjection = ref(false)
const positionYearsInput = ref(1)
let positionDebounceTimer: ReturnType<typeof setTimeout> | null = null

const positionSliderMax = computed(() => {
  const retireDate = projections.userEntry.value?.retire_date
  if (!retireDate) return 30
  const years = Math.ceil((new Date(retireDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000))
  return Math.max(1, years)
})

watch(usePositionProjection, (on) => {
  if (!on) {
    positionYearsInput.value = 1
    projections.projectionYears.value = 0
  }
})

watch(positionYearsInput, (val) => {
  if (positionDebounceTimer) clearTimeout(positionDebounceTimer)
  positionDebounceTimer = setTimeout(() => {
    projections.projectionYears.value = val
  }, 500)
})

onUnmounted(() => {
  if (positionDebounceTimer) clearTimeout(positionDebounceTimer)
})
</script>
