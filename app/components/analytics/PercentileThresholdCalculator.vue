<script setup lang="ts">
defineProps<{
  result: { year: string } | null
  targetPercentile: number
  minPercentile: number
  maxPercentile: number
  hasEmployeeNumber: boolean
}>()

const emit = defineEmits<{
  percentileChange: [number]
}>()

function handlePercentileChange(value: number | undefined) {
  if (value !== undefined) emit('percentileChange', value)
}
</script>

<template>
  <div class="space-y-4">
    <!-- No employee number state -->
    <UAlert
      v-if="!hasEmployeeNumber"
      icon="i-lucide-user-search"
      color="warning"
      variant="subtle"
      title="Employee Number Required"
      description="Set your employee number in Settings to use the percentile threshold calculator."
    />

    <template v-else>
      <!-- Percentile selector -->
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-[var(--ui-text-muted)]">Target percentile:</span>
          <UBadge color="primary" variant="subtle" size="sm" class="font-mono">
            {{ targetPercentile }}%
          </UBadge>
        </div>
        <USlider
          :model-value="targetPercentile"
          :min="minPercentile"
          :max="maxPercentile"
          :step="0.5"
          aria-label="Target percentile"
          @update:model-value="handlePercentileChange"
        />
        <div class="flex justify-between text-xs text-[var(--ui-text-muted)]">
          <span>Today: {{ minPercentile }}%</span>
          <span>Retirement: {{ maxPercentile }}%</span>
        </div>
      </div>

      <!-- Result card -->
      <UCard v-if="result">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar-check" class="size-4 text-primary" />
          <p class="text-sm">
            At current attrition, you could reach the
            <strong>{{ targetPercentile }}th percentile</strong>
            by
            <strong class="font-mono">{{ result.year }}</strong>.
          </p>
        </div>
      </UCard>

      <UCard v-else>
        <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
          <UIcon name="i-lucide-clock" class="size-4" />
          Based on current data, this threshold is not projected to be reached within 15 years.
        </div>
        <p class="mt-1 text-xs text-[var(--ui-text-muted)]">Projection horizon is capped at 15 years.</p>
      </UCard>
    </template>
  </div>
</template>
