<script setup lang="ts">
import { useStanding, useTrajectory } from '~/composables/seniority'

// The short extras under the Now figures: a glance list, with the longer tables behind a disclosure.
const { qualificationScope, growthAssumptions } = useScenario()
const { glance, baseStatus, rankCard } = useStanding(qualificationScope)
const { changes } = useTrajectory(growthAssumptions, qualificationScope)
const { activeTab } = useDashboardTabs()
</script>

<template>
  <div>
    <dl class="mt-2" data-testid="standing-glance">
      <div v-for="item in glance" :key="item.label" class="flex flex-wrap items-baseline gap-x-2 py-1">
        <dt class="font-serif text-base text-default">{{ item.label }}</dt>
        <span class="min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-default" aria-hidden="true" />
        <dd class="font-mono font-medium text-highlighted">{{ item.value }}</dd>
        <dd v-if="item.note" class="w-full text-right font-serif text-xs italic text-muted">{{ item.note }}</dd>
      </div>
    </dl>

    <UCollapsible class="mt-4">
      <UButton label="More detail" color="neutral" variant="link" size="sm" trailing-icon="i-lucide-chevron-down" class="px-0" />
      <template #content>
        <div class="mt-3 space-y-6">
          <DashboardBaseStatusTable :data="baseStatus" :no-result-label="rankCard.noResultLabel" />
          <DashboardTrajectoryDeltaSparkline v-if="changes.length > 0" :changes="changes" />
          <UButton label="Open Qualifications" color="neutral" variant="link" size="sm" trailing-icon="i-lucide-arrow-right" class="px-0" @click="activeTab = 'qualifications'" />
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
