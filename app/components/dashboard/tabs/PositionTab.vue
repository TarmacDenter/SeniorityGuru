<script setup lang="ts">
import { useSeniorityCore } from '~/composables/seniority'
import { addYearsDate, diffDateYears } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'
import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, presentQualificationPositions, type GrowthAssumptions } from '~/utils/seniority'

defineProps<{ loading?: boolean }>()

const { hasData, newHire, anchoredLens, projectionEndDate } = useSeniorityCore()
const { employeeNumber } = useUser()
const hasEmployeeNumber = computed(() => !!employeeNumber.value || !!newHire.syntheticEntry.value)

const growthAssumptions = ref<GrowthAssumptions>({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS })
const usePositionProjection = ref(false)
const positionYearsInput = ref(1)
const projectionYears = ref(0)
const projectionDate = computed(() => addYearsDate(todayPlainDate(), projectionYears.value))
const qualificationPositions = computed(() => presentQualificationPositions(
  anchoredLens.value?.qualificationPositions({
    through: projectionDate.value,
    growthAssumptions: growthAssumptions.value,
  }) ?? [],
))

const hasProjection = computed(() =>
  qualificationPositions.value.some(
    position => Math.abs(position.projectedPercentile - position.currentPercentile) > 0.1,
  ),
)
let positionDebounceTimer: ReturnType<typeof setTimeout> | null = null

const positionSliderMax = computed(() => {
  if (!projectionEndDate.value) return 0
  const years = Math.ceil(diffDateYears(todayPlainDate(), projectionEndDate.value))
  return Math.max(1, years)
})

watch(usePositionProjection, (on) => {
  if (!on) {
    positionYearsInput.value = 1
    projectionYears.value = 0
  }
})

watch(positionYearsInput, (val) => {
  if (positionDebounceTimer) clearTimeout(positionDebounceTimer)
  positionDebounceTimer = setTimeout(() => {
    projectionYears.value = val
  }, 500)
})

onUnmounted(() => {
  if (positionDebounceTimer) clearTimeout(positionDebounceTimer)
})
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Loading skeleton -->
    <div v-if="loading" class="p-3 sm:p-6 space-y-4">
      <USkeleton class="h-10 w-48" />
      <USkeleton class="h-48" />
      <USkeleton class="h-32" />
    </div>

    <!-- Empty state: no seniority data -->
    <UEmpty
      v-else-if="!hasData"
      icon="i-lucide-map-pin"
      title="No Seniority Data Yet"
      description="Upload your airline's seniority list to see your position across all qualifications and see holdability projections."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24 flex-1"
    />

    <template v-else>
    <!-- Projection controls — pinned toolbar -->
    <div class="shrink-0 bg-[var(--ui-bg)] border-b border-[var(--ui-border)] px-3 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <USwitch v-model="usePositionProjection" :disabled="positionSliderMax === 0" />
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
      <span v-if="positionSliderMax === 0" class="text-sm text-[var(--ui-text-muted)]">Add a retirement date to project forward.</span>
      <UBadge v-else color="neutral" variant="subtle" size="sm">As of today</UBadge>
    </div>

    <!-- Growth assumption bar -->
    <DashboardGrowthBar v-model="growthAssumptions" />

    <!-- Scrollable content -->
    <div class="p-3 sm:p-6 space-y-6 flex-1 overflow-y-auto">
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

      <!-- Qualification Seniority Scale -->
      <UCard v-if="qualificationPositions.length > 0">
        <template #header>
          <h3 class="font-semibold">Seniority Position by Qualification</h3>
        </template>
        <AnalyticsQualSeniorityScale :positions="qualificationPositions" />
      </UCard>

      <UAlert
        v-else-if="!hasEmployeeNumber"
        icon="i-lucide-user-search"
        color="warning"
        variant="subtle"
        title="Employee Number Required"
        description="Set your employee number in Settings to see your position across qualifications."
      />
    </div>
    </template>
  </div>
</template>
