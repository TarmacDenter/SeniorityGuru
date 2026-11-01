<script setup lang="ts">
import { useDemographics } from '~/composables/seniority'
import { useScenario } from '~/composables/useScenario'

// Who holds each Qualification: a grid of cards that follows the scenario's Qualification Scope.
// Needs no Anchor Pilot; with one, the Years of service card marks the Anchor Pilot's bucket.
const { qualificationScope } = useScenario()
const {
  hasResult, qualificationComposition, matchingPilotCount, ageDistribution, captainQualificationThresholds,
  yearsOfServiceDistribution, yearsOfServiceBuckets, hasYearsOfService, retirementAge, userYos,
} = useDemographics(qualificationScope)

const ready = useDeferredReady()
const showSections = computed(() => ready.value && hasResult.value)

// The cards render after first paint, so a link to one (#junior-captains) has nothing to land on
// until they appear; scroll to it then.
const route = useRoute()
const root = useTemplateRef<HTMLElement>('root')
watch(showSections, async (shown) => {
  if (!shown || !route.hash) return
  await nextTick()
  root.value?.querySelector(`[id="${CSS.escape(route.hash.slice(1))}"]`)?.scrollIntoView()
}, { immediate: true })
</script>

<template>
  <section ref="root" aria-labelledby="demographics-heading" class="space-y-4">
    <div>
      <h2 id="demographics-heading" class="text-lg font-semibold text-highlighted">Who holds each Qualification</h2>
      <p class="mt-1 text-sm text-muted">
        Sizes, composition, ages and years of service for the pilots in the Qualification Scope.
      </p>
    </div>

    <UEmpty
      v-if="showSections && matchingPilotCount === 0"
      icon="i-lucide-users"
      title="No pilots in this Qualification Scope"
      description="No pilots match the selected Qualification Scope. Choose another scope to explore demographics."
      class="py-16"
    />

    <div v-else-if="!showSections" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <USkeleton class="h-64" />
      <USkeleton class="h-64" />
      <USkeleton class="h-64" />
      <USkeleton class="h-64" />
    </div>

    <!-- Two independent columns, so a tall Sizes table does not stretch its neighbor. -->
    <div v-else class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <div class="space-y-6">
        <AnalyticsQualSizesCard :composition="qualificationComposition" />

        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">Composition</h3>
          </template>
          <div class="space-y-2">
            <AnalyticsQualCompositionCard v-for="row in qualificationComposition" :key="row.qualificationLabel" :row="row" />
          </div>
        </UCard>
      </div>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">Ages</h3>
          </template>
          <AnalyticsAgeDistributionChart
            :buckets="ageDistribution.buckets"
            :null-count="ageDistribution.nullCount"
            :mandatory-retirement-age="retirementAge"
          />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">Years of service</h3>
          </template>
          <AnalyticsYearsOfServiceBreakdown
            v-if="hasYearsOfService"
            :distribution="yearsOfServiceDistribution"
            :histogram="yearsOfServiceBuckets"
            :user-yos="userYos"
          />
          <UEmpty
            v-else
            icon="i-lucide-calendar"
            title="Years of service unavailable"
            description="No hire dates are available for the pilots in this Qualification Scope."
          />
        </UCard>

        <UCard id="junior-captains" :ui="{ body: 'px-0 py-0 sm:px-4 sm:py-3' }">
          <template #header>
            <h3 class="font-semibold text-highlighted">Junior captains</h3>
          </template>
          <AnalyticsJuniorCaptainTable v-if="captainQualificationThresholds.length" :rows="captainQualificationThresholds" />
          <UEmpty
            v-else
            icon="i-lucide-users"
            title="No captains in this scope"
            description="No captains hold a Qualification in the selected Qualification Scope."
          />
        </UCard>
      </div>
    </div>
  </section>
</template>
