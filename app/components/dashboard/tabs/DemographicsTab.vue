<script setup lang="ts">
import { useSeniorityCore, useQualFilter } from '~/composables/seniority'
import { computeYOS } from '~/utils/date'
import { createLens, createScenario } from '~/utils/seniority-engine'
import { todayPlainDate } from '~/utils/temporal'

defineProps<{ loading?: boolean }>()

const { hasData, newHire, snapshot, lens, userEntry } = useSeniorityCore()
const { retirementAge } = useUser()
const qualFilter = useQualFilter()
const demographicScenario = computed(() => createScenario({ projectionDate: todayPlainDate(), scopeFilter: qualFilter.qualSpec.value }))
const demographicsResult = computed(() => {
  if (!snapshot.value) return null
  return (lens.value ?? createLens(snapshot.value, undefined, todayPlainDate())).demographics(retirementAge.value, demographicScenario.value)
})
const ageDistribution = computed(() => demographicsResult.value?.ageDistribution ?? { buckets: [], nullCount: 0 })
const mostJuniorCAs = computed(() => demographicsResult.value?.mostJuniorCAs ?? [])
const qualComposition = computed(() => demographicsResult.value?.qualComposition ?? [])
const yosDistribution = computed(() => demographicsResult.value?.yosDistribution ?? { entryFloor: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 })
const yosHistogram = computed(() => demographicsResult.value?.yosHistogram ?? [])

const userYos = computed(() => {
  const synthetic = newHire.syntheticEntry.value
  if (synthetic) return computeYOS(synthetic.hire_date, todayPlainDate())
  if (userEntry.value) return computeYOS(userEntry.value.hire_date, todayPlainDate())
  return undefined
})

const userSeniorityNumber = computed(() =>
  newHire.syntheticEntry.value?.seniority_number ?? userEntry.value?.seniority_number,
)

const ready = useDeferredReady()
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-10 w-64" />
      <USkeleton class="h-48" />
      <USkeleton class="h-32" />
      <USkeleton class="h-64" />
    </div>

    <!-- Empty state: no seniority data -->
    <UEmpty
      v-else-if="!hasData"
      icon="i-lucide-users"
      title="No Seniority Data Yet"
      description="Upload your airline's seniority list to explore demographics, age distribution, and qual composition."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24"
    />

    <template v-else>
    <AnalyticsQualFilterBar
      :fleet="qualFilter.selectedFleet.value"
      :seat="qualFilter.selectedSeat.value"
      :base="qualFilter.selectedBase.value"
      :fleets="qualFilter.availableFleets.value"
      :seats="qualFilter.availableSeats.value"
      :bases="qualFilter.availableBases.value"
      @update:fleet="qualFilter.selectedFleet.value = $event"
      @update:seat="qualFilter.selectedSeat.value = $event"
      @update:base="qualFilter.selectedBase.value = $event"
    />

    <!-- Most Junior Captain by Qual — full width, own row -->
    <USkeleton v-if="!ready || !mostJuniorCAs.length" class="h-48 rounded-lg" />
    <UCard v-else>
      <template #header>
        <h3 class="font-semibold">Most Junior Captain by Qual</h3>
      </template>
      <AnalyticsJuniorCaptainTable
        :rows="mostJuniorCAs"
        :user-seniority-number="userSeniorityNumber"
      />
    </UCard>

    <!-- Base / Fleet / Seat Sizes — own row -->
    <USkeleton v-if="!ready || !qualComposition.length" class="h-32 rounded-lg" />
    <AnalyticsQualSizesCard v-else :composition="qualComposition" />

    <!-- Qual Composition list — full width, own row -->
    <USkeleton v-if="!ready || !qualComposition.length" class="h-64 rounded-lg" />
    <UCard v-else>
      <template #header>
        <h3 class="font-semibold">Qual Composition</h3>
      </template>
      <div class="space-y-2">
        <AnalyticsQualCompositionCard
          v-for="row in qualComposition"
          :key="row.qualKey"
          :row="row"
        />
      </div>
    </UCard>

    <!-- Age distribution -->
    <USkeleton v-if="!ready || !ageDistribution.buckets.length" class="h-64 rounded-lg" />
    <UCard v-else>
      <template #header>
        <h3 class="font-semibold">Age Distribution{{ qualFilter.qualLabel.value ? ` — ${qualFilter.qualLabel.value}` : '' }}</h3>
      </template>
      <AnalyticsAgeDistributionChart
        :buckets="ageDistribution.buckets"
        :null-count="ageDistribution.nullCount"
      />
    </UCard>

    <!-- YOS breakdown -->
    <USkeleton v-if="!ready || !yosHistogram.length" class="h-48 rounded-lg" />
    <UCard v-else>
      <template #header>
        <h3 class="font-semibold">Years of Service{{ qualFilter.qualLabel.value ? ` — ${qualFilter.qualLabel.value}` : '' }}</h3>
      </template>
      <AnalyticsYearsOfServiceBreakdown
        :distribution="yosDistribution"
        :histogram="yosHistogram"
        :user-yos="userYos"
      />
    </UCard>
    </template>
  </div>
</template>
