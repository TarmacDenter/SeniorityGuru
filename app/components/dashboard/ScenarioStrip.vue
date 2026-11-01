<script setup lang="ts">
import type { GrowthAssumptions } from '~/utils/seniority'

const scopeLabel = defineModel<string>('scopeLabel', { required: true })
const growthAssumptions = defineModel<GrowthAssumptions>('growthAssumptions', { required: true })

defineProps<{
  scopeLabels: string[]
  asOfLabel: string
  listLabel: string | null
  growthLabel: string
  isDemo: boolean
  isHistorical: boolean
}>()

// On a phone the strip collapses to one summary line; from sm up the controls are always shown.
const open = ref(false)
</script>

<template>
  <section
    aria-label="Scenario"
    data-testid="scenario-strip"
    class="sticky top-0 z-10 border-b border-default bg-elevated px-4 sm:px-6 py-2"
  >
    <button
      type="button"
      class="sm:hidden flex w-full min-h-11 items-center justify-between gap-2 text-left text-sm"
      :aria-expanded="open"
      aria-controls="scenario-strip-controls"
      @click="open = !open"
    >
      <span class="truncate text-highlighted" data-testid="scenario-summary">
        {{ scopeLabel }} · As of {{ asOfLabel }} · {{ growthLabel }}
      </span>
      <UIcon :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 shrink-0 text-muted" />
    </button>

    <div
      id="scenario-strip-controls"
      class="flex-col gap-3 pt-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:pt-0"
      :class="open ? 'flex' : 'hidden'"
    >
      <label v-if="scopeLabels.length > 1" class="flex items-center gap-2 text-sm text-muted">
        <span>Qualification Scope</span>
        <USelect v-model="scopeLabel" :items="scopeLabels" size="sm" class="min-w-40" />
      </label>

      <p class="flex flex-wrap items-center gap-x-2 text-sm text-muted" data-testid="scenario-as-of">
        <span>As-of Date</span>
        <span class="font-mono text-highlighted">{{ asOfLabel }}</span>
        <span v-if="listLabel" class="text-muted">· {{ listLabel }}</span>
        <UBadge v-if="isDemo" color="neutral" variant="outline" size="sm">Demo</UBadge>
        <UBadge v-if="isHistorical" color="neutral" variant="outline" size="sm">Historical</UBadge>
      </p>

      <DashboardGrowthBar v-model="growthAssumptions" class="!border-0 !p-0 !bg-transparent" />
    </div>
  </section>
</template>
