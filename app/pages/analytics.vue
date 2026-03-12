<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Analytics" />
    </template>

    <template #body>
      <div class="p-4 sm:p-6">
        <UTabs v-model="activeTab" :items="tabItems" :content="false" variant="link" class="mb-6" />

        <!-- Demographics tab -->
        <div v-if="activeTab === 'demographics'" class="space-y-6 py-4">
          <!-- Qual filter bar — shared across all tabs -->
          <div class="flex gap-3 flex-wrap items-center">
            <USelect
              :model-value="demographics.selectedFleet.value ?? undefined"
              :items="demographics.availableFleets.value"
              placeholder="All Fleets"
              class="w-40"
              @update:model-value="demographics.selectedFleet.value = $event ?? null"
            />
            <USelect
              :model-value="demographics.selectedSeat.value ?? undefined"
              :items="demographics.availableSeats.value"
              placeholder="All Seats"
              class="w-40"
              @update:model-value="demographics.selectedSeat.value = $event ?? null"
            />
            <USelect
              :model-value="demographics.selectedBase.value ?? undefined"
              :items="demographics.availableBases.value"
              placeholder="All Bases"
              class="w-40"
              @update:model-value="demographics.selectedBase.value = $event ?? null"
            />
            <UButton
              v-if="demographics.selectedFleet.value || demographics.selectedSeat.value || demographics.selectedBase.value"
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="clearQualFilter"
            >
              Clear filter
            </UButton>
          </div>

          <!-- Row 1: Junior CA table + Qual Composition -->
          <div class="grid grid-cols-5 gap-6">
            <div class="col-span-3">
              <UCard>
                <template #header>
                  <h3 class="font-semibold">Most Junior Captain by Qual</h3>
                </template>
                <AnalyticsJuniorCaptainTable
                  :rows="demographics.mostJuniorCAs.value"
                  :user-seniority-number="demographics.userEntry.value?.seniority_number"
                />
              </UCard>
            </div>
            <div class="col-span-2 space-y-3 overflow-y-auto max-h-96">
              <AnalyticsQualCompositionCard
                v-for="row in demographics.qualComposition.value"
                :key="row.qualKey"
                :row="row"
              />
            </div>
          </div>

          <!-- Row 2: Age distribution -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Age Distribution{{ selectedQualLabel ? ` — ${selectedQualLabel}` : '' }}</h3>
            </template>
            <AnalyticsAgeDistributionChart
              :buckets="demographics.ageDistribution.value.buckets"
              :null-count="demographics.ageDistribution.value.nullCount"
            />
          </UCard>

          <!-- Row 3: YOS breakdown -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Years of Service{{ selectedQualLabel ? ` — ${selectedQualLabel}` : '' }}</h3>
            </template>
            <AnalyticsYearsOfServiceBreakdown
              :distribution="demographics.yosDistribution.value"
              :histogram="demographics.yosHistogram.value"
              :user-yos="userYos"
            />
          </UCard>
        </div>

        <!-- Projections tab -->
        <div v-else-if="activeTab === 'projections'" class="space-y-6 py-4">
          <!-- Shared qual filter bar (same refs as demographics) -->
          <div class="flex gap-3 flex-wrap items-center">
            <USelect
              :model-value="demographics.selectedFleet.value ?? undefined"
              :items="demographics.availableFleets.value"
              placeholder="All Fleets"
              class="w-40"
              @update:model-value="demographics.selectedFleet.value = $event ?? null"
            />
            <USelect
              :model-value="demographics.selectedSeat.value ?? undefined"
              :items="demographics.availableSeats.value"
              placeholder="All Seats"
              class="w-40"
              @update:model-value="demographics.selectedSeat.value = $event ?? null"
            />
            <USelect
              :model-value="demographics.selectedBase.value ?? undefined"
              :items="demographics.availableBases.value"
              placeholder="All Bases"
              class="w-40"
              @update:model-value="demographics.selectedBase.value = $event ?? null"
            />
            <UButton
              v-if="demographics.selectedFleet.value || demographics.selectedSeat.value || demographics.selectedBase.value"
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="clearQualFilter"
            >
              Clear filter
            </UButton>
          </div>

          <AnalyticsAssumptionsBanner
            :is-banner-dismissed="projections.isBannerDismissed.value"
            @dismiss="projections.dismissBanner()"
          />
          <UCard>
            <template #header>
              <h3 class="font-semibold">Seniority Power Index</h3>
            </template>
            <AnalyticsSeniorityPowerIndex
              :cells="projections.powerIndexCells.value"
              :projection-years="projections.projectionYears.value"
              :has-employee-number="!!userStore.profile?.employee_number"
              @years-change="projections.projectionYears.value = $event"
              @cell-click="onPowerIndexCellClick"
            />
          </UCard>
          <div class="grid grid-cols-11 gap-6">
            <div class="col-span-6">
              <UCard>
                <template #header>
                  <h3 class="font-semibold">Retirement Wave{{ selectedQualLabel ? ` — ${selectedQualLabel}` : '' }}</h3>
                </template>
                <AnalyticsRetirementWaveChart
                  :wave-buckets="projections.retirementWave.value"
                  :trajectory-points="projections.waveTrajectory.value"
                  :selected-qual="selectedQualLabel"
                />
              </UCard>
            </div>
            <div class="col-span-5">
              <UCard>
                <template #header>
                  <h3 class="font-semibold">Percentile Threshold{{ selectedQualLabel ? ` — ${selectedQualLabel}` : '' }}</h3>
                </template>
                <AnalyticsPercentileThresholdCalculator
                  :result="projections.thresholdResult.value"
                  :target-percentile="projections.targetPercentile.value"
                  :selected-qual="selectedQualLabel"
                  :has-employee-number="!!userStore.profile?.employee_number"
                  @percentile-change="projections.targetPercentile.value = $event"
                />
              </UCard>
            </div>
          </div>
        </div>

        <!-- Upgrades tab -->
        <div v-else-if="activeTab === 'upgrades'" class="space-y-6 py-4">
          <UCard>
            <template #header>
              <h3 class="font-semibold">Upgrade Tracker</h3>
            </template>
            <AnalyticsUpgradeTracker
              :data="upgrades.upgradeTrackerData.value"
              :loading="upgrades.upgradeTrackerLoading.value"
              :error="upgrades.upgradeTrackerError.value"
            />
          </UCard>
          <UCard>
            <template #header>
              <h3 class="font-semibold">What-If Simulator</h3>
            </template>
            <AnalyticsWhatIfSimulator
              :trajectory="upgrades.whatIfTrajectory.value"
              :target-fleet="upgrades.targetFleet.value"
              :target-seat="upgrades.targetSeat.value"
              :available-fleets="upgrades.availableFleets.value"
              :available-seats="upgrades.availableSeats.value"
              :user-entry="upgrades.userEntry.value ? { fleet: upgrades.userEntry.value.fleet, seat: upgrades.userEntry.value.seat } : undefined"
              @update:target-fleet="upgrades.targetFleet.value = $event"
              @update:target-seat="upgrades.targetSeat.value = $event"
            />
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'
import { useQualDemographics } from '~/composables/useQualDemographics'
import { useQualProjections } from '~/composables/useQualProjections'
import { useQualUpgrades } from '~/composables/useQualUpgrades'
import { computeYOS } from '#shared/utils/qual-analytics'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
  ssr: false,
})

const userStore = useUserStore()
const seniorityStore = useSeniorityStore()

onMounted(async () => {
  if (!userStore.profile) await userStore.fetchProfile()
  if (seniorityStore.lists.length === 0) await seniorityStore.fetchLists()
  if (seniorityStore.entries.length === 0) {
    const activeList = seniorityStore.lists.find(l => l.status === 'active') ?? seniorityStore.lists[0]
    if (activeList) await seniorityStore.fetchEntries(activeList.id)
  }
})

const demographics = useQualDemographics()
// Pass shared qual filter so wave chart and threshold calculator react to it
const projections = useQualProjections(demographics.qualFilterFn)
const upgrades = useQualUpgrades()

// Single qual label used in chart headings and threshold display
const selectedQualLabel = computed(() => {
  const parts: string[] = []
  if (demographics.selectedFleet.value) parts.push(demographics.selectedFleet.value)
  if (demographics.selectedSeat.value) parts.push(demographics.selectedSeat.value)
  if (demographics.selectedBase.value) parts.push(demographics.selectedBase.value)
  return parts.join(' ')
})

const userYos = computed(() => {
  const entry = demographics.userEntry.value
  return entry ? computeYOS(entry.hire_date) : undefined
})

function clearQualFilter() {
  demographics.selectedFleet.value = null
  demographics.selectedSeat.value = null
  demographics.selectedBase.value = null
}

// Clicking a power index cell pre-populates the shared filter
function onPowerIndexCellClick(cell: { fleet: string; seat: string; base: string }) {
  demographics.selectedFleet.value = cell.fleet
  demographics.selectedSeat.value = cell.seat
  demographics.selectedBase.value = cell.base
}

const activeTab = ref('demographics')
const tabItems: TabsItem[] = [
  { label: 'Demographics', value: 'demographics' },
  { label: 'Projections', value: 'projections' },
  { label: 'Upgrades', value: 'upgrades' },
]
</script>
