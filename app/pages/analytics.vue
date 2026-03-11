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
          <!-- Qual filter bar -->
          <div class="flex gap-3 flex-wrap">
            <USelect
              v-model="demographics.selectedFleet.value"
              :options="demographics.availableFleets.value"
              placeholder="All Fleets"
              class="w-40"
            />
            <USelect
              v-model="demographics.selectedSeat.value"
              :options="demographics.availableSeats.value"
              placeholder="All Seats"
              class="w-40"
            />
            <USelect
              v-model="demographics.selectedBase.value"
              :options="demographics.availableBases.value"
              placeholder="All Bases"
              class="w-40"
            />
          </div>

          <!-- Row 1: Junior CA table + Qual Composition -->
          <div class="grid grid-cols-5 gap-6">
            <div class="col-span-3">
              <UCard>
                <template #header>
                  <h3 class="font-semibold">Most Junior Captain by Fleet</h3>
                </template>
                <AnalyticsJuniorCaptainTable
                  :rows="demographics.mostJuniorCAs.value"
                  :user-seniority-number="demographics.userEntry.value?.seniority_number"
                />
              </UCard>
            </div>
            <div class="col-span-2 space-y-3">
              <AnalyticsQualCompositionCard
                v-for="row in demographics.qualComposition.value"
                :key="row.qualKey"
                :row="row"
                :selected="selectedCompositionQual === row.qualKey"
                @select="selectedCompositionQual = row.qualKey"
              />
            </div>
          </div>

          <!-- Row 2: Age distribution -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Age Distribution</h3>
            </template>
            <AnalyticsAgeDistributionChart
              :buckets="demographics.ageDistribution.value.buckets"
              :null-count="demographics.ageDistribution.value.nullCount"
            />
          </UCard>

          <!-- Row 3: YOS breakdown -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Years of Service to Qual Entry</h3>
            </template>
            <AnalyticsYearsOfServiceBreakdown
              :distribution="demographics.yosDistribution.value"
              :user-yos="userYos"
            />
          </UCard>
        </div>

        <!-- Projections tab -->
        <div v-else-if="activeTab === 'projections'" class="space-y-6 py-4">
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
                  <h3 class="font-semibold">Retirement Wave</h3>
                </template>
                <AnalyticsRetirementWaveChart
                  :wave-buckets="projections.retirementWave.value"
                  :trajectory-points="projections.waveTrajectory.value"
                  :selected-qual="selectedWaveQual"
                />
              </UCard>
            </div>
            <div class="col-span-5">
              <UCard>
                <template #header>
                  <h3 class="font-semibold">Percentile Threshold</h3>
                </template>
                <AnalyticsPercentileThresholdCalculator
                  :result="projections.thresholdResult.value"
                  :target-percentile="projections.targetPercentile.value"
                  :selected-qual="selectedThresholdQual"
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
  layout: 'seniority',
  ssr: false,
})

const userStore = useUserStore()
const seniorityStore = useSeniorityStore()

// Load data on mount
onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchProfile()
  }
  if (seniorityStore.lists.length === 0) {
    await seniorityStore.fetchLists()
  }
  // Load active list entries if available and not already loaded
  if (seniorityStore.entries.length === 0) {
    const activeList = seniorityStore.lists.find(l => l.status === 'active') ?? seniorityStore.lists[0]
    if (activeList) {
      await seniorityStore.fetchEntries(activeList.id)
    }
  }
})

const demographics = useQualDemographics()
const projections = useQualProjections()
const upgrades = useQualUpgrades()

const selectedCompositionQual = ref<string | null>(null)

const selectedWaveQual = computed(() =>
  projections.waveFleet.value && projections.waveSeat.value
    ? `${projections.waveFleet.value} ${projections.waveSeat.value}`
    : '',
)

const selectedThresholdQual = computed(() =>
  projections.thresholdFleet.value && projections.thresholdSeat.value
    ? `${projections.thresholdFleet.value} ${projections.thresholdSeat.value}`
    : '',
)

const userYos = computed(() => {
  const entry = demographics.userEntry.value
  return entry ? computeYOS(entry.hire_date) : undefined
})

function onPowerIndexCellClick(cell: { fleet: string; seat: string; base: string }) {
  projections.waveFleet.value = cell.fleet
  projections.waveSeat.value = cell.seat
  projections.waveBase.value = cell.base
  projections.thresholdFleet.value = cell.fleet
  projections.thresholdSeat.value = cell.seat
}

const activeTab = ref('demographics')
const tabItems: TabsItem[] = [
  { label: 'Demographics', value: 'demographics' },
  { label: 'Projections', value: 'projections' },
  { label: 'Upgrades', value: 'upgrades' },
]
</script>
