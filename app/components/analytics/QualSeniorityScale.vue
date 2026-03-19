<script setup lang="ts">
import type { QualDemographicScale, DensityBucket } from '#shared/utils/qual-analytics'
import { SEAT_ORDER } from '#shared/utils/qual-analytics'

const BUCKET_WIDTH_PCT = 5

const props = defineProps<{
  scales: QualDemographicScale[]
}>()

const sortedScales = computed(() =>
  [...props.scales].sort((a, b) => {
    const seatDiff = (SEAT_ORDER[a.seat] ?? 99) - (SEAT_ORDER[b.seat] ?? 99)
    if (seatDiff !== 0) return seatDiff
    const fleetDiff = a.fleet.localeCompare(b.fleet)
    if (fleetDiff !== 0) return fleetDiff
    return a.plugPercentile - b.plugPercentile
  }),
)

const rowMaxCounts = computed(() => {
  const map = new Map<string, number>()
  for (const scale of props.scales) {
    const key = `${scale.fleet} ${scale.seat} ${scale.base}`
    map.set(key, Math.max(...scale.density.map((b) => b.count), 1))
  }
  return map
})

function densityBarStyle(scale: QualDemographicScale, bucket: DensityBucket) {
  if (bucket.count === 0) return { display: 'none' }
  const key = `${scale.fleet} ${scale.seat} ${scale.base}`
  const maxInRow = rowMaxCounts.value.get(key) ?? 1
  const heightPct = (bucket.count / maxInRow) * 100
  return {
    left: `${bucket.start}%`,
    width: `${BUCKET_WIDTH_PCT}%`,
    height: `${Math.max(heightPct, 4)}%`,
    borderRadius: '1px 1px 0 0',
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

function isProjecting(scale: QualDemographicScale) {
  return Math.abs(scale.userPercentile - scale.currentUserPercentile) > 0.1
}

const hasProjection = computed(() => sortedScales.value.some(isProjecting))
</script>

<template>
  <div class="space-y-1">
    <p class="text-sm text-[var(--ui-text-muted)] mb-3">
      Each row shows the company-wide seniority distribution of pilots currently in that position. Your dot moves right as retirements improve your projected standing.
    </p>

    <div
      v-for="scale in sortedScales"
      :key="`${scale.fleet} ${scale.seat} ${scale.base}`"
      class="flex items-center gap-3 py-2 border-b border-[var(--ui-border)] last:border-0"
    >
      <div class="w-32 sm:w-40 shrink-0 text-sm font-medium truncate">
        <span>{{ scale.fleet }} {{ scale.seat }}</span>
        <span class="text-[var(--ui-text-muted)] ml-1">{{ scale.base }}</span>
        <span class="text-xs text-[var(--ui-text-muted)] ml-1">({{ scale.activeCount }})</span>
      </div>

      <div class="flex-1 relative h-10 min-w-[200px]">
        <div class="absolute inset-x-0 bottom-0 h-px bg-[var(--ui-border)]" />

        <div
          v-for="bucket in scale.density"
          :key="bucket.start"
          class="absolute bottom-0 opacity-40"
          :class="scale.isHoldable ? 'bg-[var(--ui-color-success-500)]' : 'bg-[var(--ui-color-primary-500)]'"
          :style="densityBarStyle(scale, bucket)"
        />

        <div
          class="absolute bottom-0 w-0.5 bg-[var(--ui-text-muted)] opacity-50"
          :style="{ left: `${scale.median}%`, height: '100%' }"
        />

        <div
          class="absolute bottom-0 w-0.5 border-l-2 border-dashed"
          :class="scale.isHoldable ? 'border-[var(--ui-color-success-500)]' : 'border-[var(--ui-color-error-500)]'"
          :style="{ left: `${scale.plugPercentile}%`, height: '100%' }"
        />

        <!-- Current position ghost (only shown when projecting forward) -->
        <template v-if="isProjecting(scale)">
          <div
            class="absolute bottom-0 w-0.5 z-5 bg-[var(--ui-text-muted)] opacity-30"
            :style="{ left: `${clamp(scale.currentUserPercentile)}%`, height: '100%', transform: 'translateX(-50%)' }"
          />
          <div
            class="absolute w-3 h-3 rounded-full border-2 border-[var(--ui-bg)] z-5 bg-[var(--ui-text-muted)] opacity-40"
            :style="{ left: `${clamp(scale.currentUserPercentile)}%`, top: '0', transform: 'translate(-50%, -25%)' }"
          />
        </template>

        <!-- Projected (or current) user position -->
        <div
          class="absolute bottom-0 w-0.5 z-10"
          :class="scale.isHoldable ? 'bg-[var(--ui-color-success-500)]' : 'bg-[var(--ui-color-primary-500)]'"
          :style="{ left: `${clamp(scale.userPercentile)}%`, height: '100%', transform: 'translateX(-50%)' }"
        />
        <div
          class="absolute w-3 h-3 rounded-full border-2 border-[var(--ui-bg)] z-20"
          :class="scale.isHoldable ? 'bg-[var(--ui-color-success-500)]' : 'bg-[var(--ui-color-primary-500)]'"
          :style="{ left: `${clamp(scale.userPercentile)}%`, top: '0', transform: 'translate(-50%, -25%)' }"
        />
      </div>

    </div>

    <div v-if="sortedScales.length > 0" class="flex items-center gap-3 pt-1">
      <div class="w-32 sm:w-40 shrink-0" />
      <div class="flex-1 flex justify-between text-[10px] text-[var(--ui-text-muted)] min-w-[200px]">
        <span>Junior</span>
        <span>Senior</span>
      </div>
    </div>

    <div v-if="sortedScales.length === 0" class="text-sm text-[var(--ui-text-muted)] py-4">
      No qual data available.
    </div>

    <div v-else class="flex flex-wrap gap-x-6 gap-y-1.5 pt-3 text-xs text-[var(--ui-text-muted)] border-t border-[var(--ui-border)] mt-2">
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
