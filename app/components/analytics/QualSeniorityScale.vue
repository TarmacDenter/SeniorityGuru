<script setup lang="ts">
import type { PresentedQualificationPosition } from '~/utils/seniority'
import { sortQualificationPositions } from '~/utils/qualification-order'

const props = withDefaults(defineProps<{
  positions: PresentedQualificationPosition[]
  /** Width of each density bucket, e.g. "5%". */
  densityBucketLabel?: string
}>(), { densityBucketLabel: '5%' })

const sortedPositions = computed(() => sortQualificationPositions(props.positions))
/** Qualification Positions are company-wide, so every row shares one Roster Size. */
const rosterSize = computed(() => props.positions[0]?.rosterSize ?? null)

const rowMaxCounts = computed(() => {
  const map = new Map<string, number>()
  for (const position of props.positions) {
    const key = `${position.qualification.fleet} ${position.qualification.seat} ${position.qualification.base}`
    map.set(key, Math.max(...position.percentileDensity.map(bucket => bucket.pilotCount), 1))
  }
  return map
})

function densityBarStyle(position: PresentedQualificationPosition, bucket: PresentedQualificationPosition['percentileDensity'][number]) {
  if (bucket.pilotCount === 0) return { display: 'none' }
  const key = `${position.qualification.fleet} ${position.qualification.seat} ${position.qualification.base}`
  const maxInRow = rowMaxCounts.value.get(key) ?? 1
  const heightPct = (bucket.pilotCount / maxInRow) * 100
  return {
    left: `${bucket.minimumPercentile}%`,
    width: `${bucket.maximumPercentile - bucket.minimumPercentile}%`,
    height: `${Math.max(heightPct, 4)}%`,
    borderRadius: '1px 1px 0 0',
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

function isProjecting(position: PresentedQualificationPosition) {
  return Math.abs(position.projectedPercentile - position.currentPercentile) > 0.1
}
</script>

<template>
  <div class="space-y-1">
    <p class="text-sm text-muted mb-3">
      Each row shows the company-wide seniority distribution of pilots currently in that position. Your dot moves right as retirements improve your projected standing. Heights scale independently for each Qualification to show distribution shape, not comparable pilot counts. Each threshold is the active incumbent's Rank against Roster Size, fixed at the As-of Date.
    </p>
    <p data-testid="qualification-scale-legend" class="text-sm text-muted mb-3">
      Each bar counts pilots in a {{ densityBucketLabel }} Seniority Percentile bucket. The threshold is the Qualification's most junior active pilot (Q0). A dotted Q line marks where that share of the Qualification's active pilots is junior: at Q20, 20% are junior and 80% senior.
    </p>
    <p v-if="rosterSize !== null" data-testid="qualification-scale-roster-size" class="text-sm text-muted mb-3">
      Percentiles measured against {{ rosterSize.toLocaleString() }} on roster
    </p>

    <div
      v-for="position in sortedPositions"
      :key="`${position.qualification.fleet} ${position.qualification.seat} ${position.qualification.base}`"
      class="py-2 border-b border-default last:border-0"
    >
      <div class="flex items-center gap-3">
        <div class="w-24 sm:w-28 shrink-0 text-sm font-medium">
          <div class="truncate">
            <span>{{ position.qualification.fleet }} {{ position.qualification.seat }}</span>
            <span class="text-muted ml-1">{{ position.qualification.base }}</span>
          </div>
          <div data-testid="qualification-scale-active-count" class="text-xs font-normal text-muted">
            {{ position.activePilotCount.toLocaleString() }} active in this qualification
          </div>
        </div>

        <div class="flex-1 relative h-10 min-w-[200px]">
          <div class="absolute inset-x-0 bottom-0 border-b border-default" />

          <div
            v-for="bucket in position.percentileDensity"
            :key="bucket.minimumPercentile"
            class="absolute bottom-0 bg-inverted opacity-30"
            :style="densityBarStyle(position, bucket)"
          />

          <div
            v-for="marker in position.quantileMarkers"
            :key="marker.quantile"
            data-testid="qualification-scale-quantile"
            class="absolute bottom-0 border-l-2 border-dotted border-inverted opacity-60"
            :style="{ left: `${clamp(marker.percentile)}%`, height: '100%' }"
            :title="marker.description || marker.label"
          >
            <span class="absolute top-0 left-1 text-[9px] leading-none font-mono text-muted whitespace-nowrap">{{ marker.label }}</span>
          </div>

          <div
            data-testid="qualification-scale-threshold"
            class="absolute bottom-0 w-0.5 border-l-2"
            :class="position.modeledHoldable ? 'border-solid border-inverted' : 'border-dashed border-inverted'"
            :style="{ left: `${position.thresholdPercentile}%`, height: '100%' }"
          />

          <!-- Current position ghost (only shown when projecting forward) -->
          <template v-if="isProjecting(position)">
            <div
              data-testid="qualification-scale-current-position"
              class="absolute bottom-0 w-0.5 z-5 bg-inverted opacity-30"
              :style="{ left: `${clamp(position.currentPercentile)}%`, height: '100%', transform: 'translateX(-50%)' }"
            />
            <div
              class="absolute w-3 h-3 rounded-full border-2 border-default z-5 bg-inverted opacity-40"
              :style="{ left: `${clamp(position.currentPercentile)}%`, top: '0', transform: 'translate(-50%, -25%)' }"
            />
          </template>

          <!-- Projected (or current) user position -->
          <div
            data-testid="qualification-scale-projected-position"
            class="absolute bottom-0 w-0.5 z-10 bg-mark-ink"
            :style="{ left: `${clamp(position.projectedPercentile)}%`, height: '100%', transform: 'translateX(-50%)' }"
          />
          <div
            class="absolute w-3 h-3 rounded-full border-2 border-mark-ink bg-mark z-20"
            :style="{ left: `${clamp(position.projectedPercentile)}%`, top: '0', transform: 'translate(-50%, -25%)' }"
          />
        </div>
      </div>

      <ul
        v-if="position.quantileMarkers.some(marker => marker.description)"
        data-testid="qualification-scale-quantile-distances"
        class="mt-1 ml-27 sm:ml-31 flex flex-wrap gap-x-3 text-xs font-mono text-muted"
      >
        <li v-for="marker in position.quantileMarkers" :key="marker.quantile">{{ marker.description }}</li>
      </ul>
    </div>

    <div v-if="sortedPositions.length > 0" class="flex items-center gap-3 pt-1">
      <div class="w-24 sm:w-28 shrink-0" />
      <div class="flex-1 flex justify-between text-[10px] text-muted min-w-[200px]">
        <span>Junior</span>
        <span>Senior</span>
      </div>
    </div>

    <div v-if="sortedPositions.length === 0" class="text-sm text-muted py-4">
      No qual data available.
    </div>
  </div>
</template>
