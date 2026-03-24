<script setup lang="ts">
defineProps<{
  result: { year: string } | null
  targetPercentile: number
  selectedQual: string
  hasEmployeeNumber: boolean
}>()

defineEmits<{
  percentileChange: [number]
}>()

const percentileOptions = [50, 75, 90] as const
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
      <div class="flex items-center gap-3">
        <span class="text-sm text-[var(--ui-text-muted)] shrink-0">Target percentile:</span>
        <UFieldGroup>
          <UButton
            v-for="p in percentileOptions"
            :key="p"
            size="sm"
            :color="targetPercentile === p ? 'primary' : 'neutral'"
            :variant="targetPercentile === p ? 'solid' : 'outline'"
            @click="$emit('percentileChange', p)"
          >
            Top {{ 100 - p }}%
          </UButton>
        </UFieldGroup>
      </div>

      <!-- Result card -->
      <UCard v-if="result">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar-check" class="size-4 text-primary" />
          <p class="text-sm">
            At current attrition, you could hold
            <strong>{{ selectedQual || 'this qual' }}</strong>
            in the
            <strong>top {{ 100 - targetPercentile }}%</strong>
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
