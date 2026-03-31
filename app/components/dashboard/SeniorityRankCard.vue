<script setup lang="ts">
import { computeYOS } from '~/utils/date'

const props = defineProps<{
  rank: {
    seniorityNumber: number
    adjustedSeniority?: number
    base: string
    seat: string
    fleet: string
    percentile: number
    hireDate: string
  }
}>()

const animatedPercentile = ref(0)

const yearsOfService = computed(() => {
  if (!props.rank.hireDate) return null
  const years = Math.floor(computeYOS(props.rank.hireDate))
  return years >= 0 ? years : null
})

onMounted(() => {
  requestAnimationFrame(() => {
    animatedPercentile.value = props.rank.percentile
  })
})
</script>

<template>
  <UCard variant="accent">
    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="flex items-center gap-4 flex-1">
        <div class="flex items-center justify-center size-16 rounded-xl bg-primary/10">
          <UIcon name="i-lucide-award" class="size-8 text-primary" />
        </div>
        <div>
          <p class="text-sm text-muted">Your Seniority Number</p>
          <p class="text-4xl font-bold font-mono text-highlighted">
            #{{ rank.adjustedSeniority?.toLocaleString() ?? rank.seniorityNumber.toLocaleString() }}
          </p>
          <p v-if="rank.adjustedSeniority && rank.adjustedSeniority !== rank.seniorityNumber" class="text-xs text-muted">
            List #{{ rank.seniorityNumber.toLocaleString() }} · adjusted for retirements
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

    <div class="mt-4">
      <div class="flex justify-between text-xs text-muted mb-1">
        <span>TOP %</span>
        <span class="font-mono">{{ rank.percentile }}%</span>
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

    <p v-if="yearsOfService !== null" class="text-xs text-muted mt-2">
      {{ yearsOfService }} {{ yearsOfService === 1 ? 'year' : 'years' }} of service
    </p>
  </UCard>
</template>
