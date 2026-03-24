<script setup lang="ts">
import { useSeniorityCore, useQualAnalytics } from '~/composables/seniority'
import { useUserStore } from '~/stores/user'
import { DEFAULT_GROWTH_CONFIG } from '~/utils/growth-config'
import type { GrowthConfig } from '~/utils/growth-config'

defineProps<{ loading?: boolean }>()

const userStore = useUserStore()
const { hasData, newHire } = useSeniorityCore()
const hasEmployeeNumber = computed(() => !!userStore.employeeNumber || !!newHire.syntheticEntry.value)

const growthConfig = ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG })
const projections = useQualAnalytics(growthConfig)

const usePositionProjection = ref(false)
const positionYearsInput = ref(1)

const hasProjection = computed(() =>
  projections.qualScales.value.some(
    s => Math.abs(s.userPercentile - s.currentUserPercentile) > 0.1,
  ),
)
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

<template>
  <div class="sm:-m-6 sm:flex sm:flex-col sm:h-[calc(100%+3rem)]">
    <!-- Loading skeleton -->
    <div v-if="loading" class="p-4 sm:p-6 space-y-4">
      <USkeleton class="h-10 w-48" />
      <USkeleton class="h-48" />
      <USkeleton class="h-32" />
    </div>

    <!-- Empty state: no seniority data -->
    <UEmpty
      v-else-if="!hasData"
      icon="i-lucide-map-pin"
      title="No Seniority Data Yet"
      description="Upload your airline's seniority list to see your position across all quals and see holdability projections."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24 flex-1"
    />

    <template v-else>
    <!-- Projection controls — pinned toolbar -->
    <div class="shrink-0 bg-[var(--ui-bg)] border-b border-[var(--ui-border)] px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
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

    <!-- Growth assumption bar -->
    <DashboardGrowthBar v-model="growthConfig" />

    <!-- Scrollable content -->
    <div class="p-4 sm:p-6 space-y-6">
      <!-- About this view collapsible -->
      <UCollapsible class="flex flex-col gap-2">
        <UButton
          label="About this view"
          color="neutral"
          variant="ghost"
          size="sm"
          trailing-icon="i-lucide-chevron-down"
          class="w-fit text-[var(--ui-text-muted)]"
        />
        <template #content>
          <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4 space-y-2 text-sm text-[var(--ui-text-muted)]">
            <p>The position view shows your standing within specific qualifications (fleet + seat combinations).</p>
            <p>Holdable means your projected seniority is senior to the plug — the most junior pilot currently active in that qualification. This is a projection based on scheduled retirements, not a vacancy.</p>
            <NuxtLink to="/how-it-works#holdability" class="text-primary text-sm underline">Learn more about holdability →</NuxtLink>
          </div>
        </template>
      </UCollapsible>

      <!-- Legend collapsible -->
      <UCollapsible class="flex flex-col gap-2">
        <UButton
          label="Legend"
          color="neutral"
          variant="ghost"
          size="sm"
          trailing-icon="i-lucide-chevron-down"
          class="w-fit text-[var(--ui-text-muted)]"
        />
        <template #content>
          <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4">
            <div class="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--ui-text-muted)]">
              <div class="flex items-center gap-1.5">
                <div class="flex gap-0.5">
                  <div class="w-3 h-3 rounded-full bg-[var(--ui-color-success-500)]" />
                  <div class="w-3 h-3 rounded-full bg-[var(--ui-color-primary-500)]" />
                </div>
                <span>Your position (<span class="text-[var(--ui-color-success-500)]">holdable</span> / <span class="text-[var(--ui-color-primary-500)]">not yet</span>)</span>
                <InfoIcon text="Holdable means your projected seniority number is ≤ the plug — the most junior pilot currently active in this qualification." size="xs" />
              </div>
              <div class="flex items-center gap-1.5">
                <div class="flex gap-0.5">
                  <div class="w-0.5 h-4 border-l-2 border-dashed border-[var(--ui-color-success-500)]" />
                  <div class="w-0.5 h-4 border-l-2 border-dashed border-[var(--ui-color-error-500)]" />
                </div>
                <span>Plug — most junior pilot holding</span>
                <InfoIcon text="The plug is the most junior pilot currently holding this qualification. Being senior to the plug means you can hold the position." size="xs" />
              </div>
              <div v-if="hasProjection" class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-[var(--ui-text-muted)] opacity-40" />
                <span>Current position</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-0.5 h-3 bg-[var(--ui-text-muted)] opacity-50" />
                <span>Median</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-5 h-3 rounded-sm bg-[var(--ui-color-primary-500)] opacity-40" />
                <span>Pilot density</span>
              </div>
            </div>
          </div>
        </template>
      </UCollapsible>

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
    </div>
    </template>
  </div>
</template>
