<template>
  <UCard>
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
      <div class="w-full h-2 rounded-full bg-(--ui-bg-accented)">
        <div
          class="h-full rounded-full bg-primary"
          :style="{ width: `${rank.percentile}%` }"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
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
</script>
