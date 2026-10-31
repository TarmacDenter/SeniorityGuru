<script setup lang="ts">
import type { RankCardData } from '~/composables/seniority'
import { computeYOS } from '~/utils/date'
import { todayPlainDate } from '~/utils/temporal'

const props = defineProps<{
  rank: RankCardData
}>()

const animatedPercentile = ref(0)
watch(() => props.rank.seniorityPercentile, (percentile) => {
  animatedPercentile.value = percentile
})

const yearsOfService = computed(() => {
  if (!props.rank.hireDate) return null
  const years = Math.floor(computeYOS(props.rank.hireDate, todayPlainDate()))
  return years >= 0 ? years : null
})

// 'accent' is a custom UCard variant defined in app.config.ts — not in Nuxt UI types
const accentVariant = 'accent' as 'solid'

onMounted(() => {
  requestAnimationFrame(() => {
    animatedPercentile.value = props.rank.seniorityPercentile
  })
})
</script>

<template>
  <UCard :variant="accentVariant">
    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="flex items-center gap-4 flex-1">
        <div class="flex items-center justify-center size-16 rounded-xl bg-primary/10">
          <UIcon name="i-lucide-award" class="size-8 text-primary" />
        </div>
        <div data-testid="seniority-number">
          <p class="text-sm text-muted">{{ rank.isSimulated ? 'Simulated Seniority Number' : 'Seniority Number' }}</p>
          <p class="text-4xl font-bold font-mono text-highlighted">
            #{{ rank.seniorityNumber.toLocaleString() }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 text-center sm:text-right">
        <div>
          <p class="text-xs text-muted">Base</p>
          <p class="font-mono font-semibold text-highlighted">{{ rank.base }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Seat</p>
          <p class="font-mono font-semibold text-highlighted">{{ rank.seat }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Fleet</p>
          <p class="font-mono font-semibold text-highlighted">{{ rank.fleet }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 mt-4">
      <div data-testid="publication-position">
        <p class="text-xs text-muted">Publication Position</p>
        <p class="font-mono font-semibold text-highlighted">{{ rank.publicationPosition.toLocaleString() }} of {{ rank.rosterSize.toLocaleString() }}</p>
      </div>
      <div data-testid="rank">
        <p class="text-xs text-muted">Rank</p>
        <p class="font-mono font-semibold text-highlighted">{{ rank.rank.toLocaleString() }} of {{ rank.rosterSize.toLocaleString() }}</p>
      </div>
    </div>
    <p v-if="rank.isSimulated" class="text-xs text-muted mt-2">
      Modeled counts include the simulated pilot ({{ rank.publicationRosterSize.toLocaleString() }} in publication).
    </p>

    <div class="mt-4">
      <div class="flex justify-between text-xs text-muted mb-1">
        <span>Seniority Percentile</span>
        <span class="font-mono">{{ rank.seniorityPercentile }}%</span>
      </div>
      <UProgress
        :model-value="animatedPercentile"
        :max="100"
        size="sm"
        :ui="{
          indicator: 'bg-gradient-to-r from-primary to-secondary',
        }"
      />
    </div>

    <p class="text-xs text-muted mt-2">Percentile of Rank among {{ rank.rosterSize.toLocaleString() }} pilots ({{ rank.activePilotCount.toLocaleString() }} active).</p>

    <p v-if="yearsOfService !== null" class="text-xs text-muted mt-2">
      {{ yearsOfService }} {{ yearsOfService === 1 ? 'year' : 'years' }} of service
    </p>
  </UCard>
</template>
