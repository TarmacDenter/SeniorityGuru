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

        <!-- Growth controls -->
        <div class="flex items-center gap-2 ml-4 pl-4 border-l border-[var(--ui-border)]">
          <USwitch v-model="growthEnabled" size="xs" />
          <span class="text-sm text-[var(--ui-text-muted)]">Hiring growth</span>
          <InfoIcon text="Growth adds simulated new hires each year, diluting everyone's percentile. Has no effect on your raw rank." size="xs" />
          <template v-if="growthEnabled">
            <USlider
              v-model="growthSliderValue"
              :min="1"
              :max="20"
              :step="1"
              class="w-32"
            />
            <UBadge color="primary" variant="subtle" size="sm" class="font-mono">
              {{ (growthSliderValue * 0.5).toFixed(1) }}%/yr
            </UBadge>
          </template>
        </div>
      </template>
      <UBadge v-else color="neutral" variant="subtle" size="sm">As of today</UBadge>
    </div>

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

      <!-- Base/Seat Status Table -->
      <DashboardBaseStatusTable v-if="userFound" :data="baseStatusData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQualProjections } from '~/composables/useQualProjections'
import { useDashboardStats } from '~/composables/useDashboardStats'

const projections = useQualProjections()

const { hasEmployeeNumber, userFound, baseStatusData } = useDashboardStats()

const usePositionProjection = ref(false)
const positionYearsInput = ref(1)
let positionDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Growth controls — slider value is integer 1–20, mapped to rate via * 0.005
const growthEnabled = ref(projections.growthConfig.value.enabled)
const growthSliderValue = ref(projections.growthConfig.value.annualRate / 0.005)
let growthDebounceTimer: ReturnType<typeof setTimeout> | null = null

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
    growthEnabled.value = false
    projections.growthConfig.value = { ...projections.growthConfig.value, enabled: false }
  }
})

watch(positionYearsInput, (val) => {
  if (positionDebounceTimer) clearTimeout(positionDebounceTimer)
  positionDebounceTimer = setTimeout(() => {
    projections.projectionYears.value = val
  }, 500)
})

watch(growthEnabled, (on) => {
  projections.growthConfig.value = { ...projections.growthConfig.value, enabled: on }
})

watch(growthSliderValue, (val) => {
  if (growthDebounceTimer) clearTimeout(growthDebounceTimer)
  growthDebounceTimer = setTimeout(() => {
    projections.growthConfig.value = { ...projections.growthConfig.value, annualRate: val * 0.005 }
  }, 500)
})

onUnmounted(() => {
  if (positionDebounceTimer) clearTimeout(positionDebounceTimer)
  if (growthDebounceTimer) clearTimeout(growthDebounceTimer)
})
</script>
