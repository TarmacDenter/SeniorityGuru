<script setup lang="ts">
import type { GrowthAssumptions } from '~/utils/seniority'

const selectedListId = defineModel<number | undefined>('selectedListId')
const scopeLabel = defineModel<string>('scopeLabel', { required: true })
const growthAssumptions = defineModel<GrowthAssumptions>('growthAssumptions', { required: true })

defineProps<{
  scopeLabels: string[]
  asOfLabel: string
  listOptions: { id: number | undefined; label: string; isLatest: boolean }[]
  growthLabel: string
  isDemo: boolean
  isHistorical: boolean
}>()
</script>

<template>
  <DashboardControls v-slot="{ sheet }">
    <section
      aria-label="Scenario"
      data-testid="scenario-strip"
      :class="sheet ? '' : 'sticky top-0 z-10 border-b border-default bg-elevated px-4 sm:px-6 py-2'"
    >
      <div
        class="flex"
        :class="sheet ? 'flex-col gap-3' : 'flex-wrap items-center gap-x-6 gap-y-2'"
      >
        <USelectMenu
          v-if="listOptions.length > 0"
          v-model="selectedListId"
          :items="listOptions"
          value-key="id"
          label-key="label"
          placeholder="Select list..."
          size="sm"
          aria-label="Seniority List"
          :class="sheet ? 'w-full' : 'w-72'"
        />

        <label v-if="scopeLabels.length > 1" class="flex items-center gap-2 text-sm text-muted">
          <span>Qualification Scope</span>
          <USelect v-model="scopeLabel" :items="scopeLabels" size="sm" class="min-w-40" />
        </label>

        <p class="flex flex-wrap items-center gap-x-2 text-sm text-muted" data-testid="scenario-as-of">
          <span>As-of Date</span>
          <span class="font-mono text-highlighted">{{ asOfLabel }}</span>
          <UBadge v-if="isDemo" color="neutral" variant="outline" size="sm">Demo</UBadge>
          <UBadge v-if="isHistorical" color="neutral" variant="outline" size="sm">Historical</UBadge>
        </p>

        <DashboardGrowthBar v-model="growthAssumptions" class="!border-0 !p-0 !bg-transparent" />
      </div>
    </section>
  </DashboardControls>
</template>
