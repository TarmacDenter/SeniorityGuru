<script setup lang="ts">
import { useQualProjections } from '~/composables/useQualProjections'
import { useUserStore } from '~/stores/user'
import { DEFAULT_GROWTH_CONFIG } from '#shared/types/growth-config'
import type { GrowthConfig } from '#shared/types/growth-config'

const userStore = useUserStore()
const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number)

const growthConfig = ref<GrowthConfig>({ ...DEFAULT_GROWTH_CONFIG })
const projections = useQualProjections(undefined, growthConfig)

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

<template>
  <div class="-m-4 sm:-m-6 flex flex-col h-[calc(100%+2rem)] sm:h-[calc(100%+3rem)]">
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
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
  </div>
</template>
