<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { useDemographics } from '~/composables/seniority'

// Who holds each Qualification: composition, sizes, age and years of service, filtered by fleet, seat and base.
const {
  filter, qualificationLabel, hasResult, qualificationComposition, matchingPilotCount, ageDistribution,
  captainQualificationThresholds, yearsOfServiceDistribution, yearsOfServiceBuckets, retirementAge, userYos,
} = useDemographics()

const ready = useDeferredReady()
const showSections = computed(() => ready.value && hasResult.value)
const titleSuffix = computed(() => (qualificationLabel.value ? ` — ${qualificationLabel.value}` : ''))

const bannerDismissed = useLocalStorage('qual-projections-banner-dismissed', false)
</script>

<template>
  <section aria-labelledby="demographics-heading" class="mt-10 space-y-6">
    <div>
      <h2 id="demographics-heading" class="font-serif text-xl font-semibold text-highlighted">Who holds each Qualification</h2>
      <p class="mt-1 font-serif text-sm italic text-muted">
        Composition, sizes, age and years of service for the pilots matching the filter.
      </p>
    </div>

    <AnalyticsQualFilterBar
      :fleet="filter.selectedFleet.value"
      :seat="filter.selectedSeat.value"
      :base="filter.selectedBase.value"
      :fleets="filter.availableFleets.value"
      :seats="filter.availableSeats.value"
      :bases="filter.availableBases.value"
      @update:fleet="filter.selectedFleet.value = $event"
      @update:seat="filter.selectedSeat.value = $event"
      @update:base="filter.selectedBase.value = $event"
    />

    <AnalyticsAssumptionsBanner
      :is-banner-dismissed="bannerDismissed"
      context="position"
      @dismiss="bannerDismissed = !bannerDismissed"
    />

    <UEmpty
      v-if="showSections && matchingPilotCount === 0"
      icon="i-lucide-users"
      title="No matching pilots"
      description="No pilots match the selected qualification filters. Clear or change the filters to explore demographics."
      class="py-16"
    />

    <div v-else-if="!showSections" class="space-y-4">
      <USkeleton class="h-48" />
      <USkeleton class="h-32" />
      <USkeleton class="h-64" />
    </div>

    <template v-else>
      <section aria-labelledby="junior-captain-heading">
        <h3 id="junior-captain-heading" class="border-b-2 border-highlighted pb-1 font-serif text-base font-semibold text-highlighted">Most Junior Captain by Qual</h3>
        <UEmpty
          v-if="!captainQualificationThresholds.length"
          icon="i-lucide-users"
          title="No captains in this scope"
          description="No captains have a Qualification Threshold in the selected scope. Other demographics include the matching pilots."
        />
        <AnalyticsJuniorCaptainTable v-else :rows="captainQualificationThresholds" class="mt-2" />
      </section>

      <AnalyticsQualSizesCard :composition="qualificationComposition" />

      <section aria-labelledby="composition-heading">
        <h3 id="composition-heading" class="border-b-2 border-highlighted pb-1 font-serif text-base font-semibold text-highlighted">Qual Composition</h3>
        <div class="mt-2 space-y-2">
          <AnalyticsQualCompositionCard v-for="row in qualificationComposition" :key="row.qualificationLabel" :row="row" />
        </div>
      </section>

      <section aria-labelledby="age-heading">
        <h3 id="age-heading" class="border-b-2 border-highlighted pb-1 font-serif text-base font-semibold text-highlighted">Age Distribution{{ titleSuffix }}</h3>
        <AnalyticsAgeDistributionChart
          class="mt-2"
          :buckets="ageDistribution.buckets"
          :null-count="ageDistribution.nullCount"
          :mandatory-retirement-age="retirementAge"
        />
      </section>

      <section aria-labelledby="yos-heading">
        <h3 id="yos-heading" class="border-b-2 border-highlighted pb-1 font-serif text-base font-semibold text-highlighted">Years of Service{{ titleSuffix }}</h3>
        <AnalyticsYearsOfServiceBreakdown
          class="mt-2"
          :distribution="yearsOfServiceDistribution"
          :histogram="yearsOfServiceBuckets"
          :user-yos="userYos"
        />
      </section>
    </template>
  </section>
</template>
