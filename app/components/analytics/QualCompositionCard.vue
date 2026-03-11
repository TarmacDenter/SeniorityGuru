<template>
  <UCard
    :class="[
      'cursor-pointer transition-colors',
      selected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-[var(--ui-border)]',
    ]"
    @click="$emit('select')"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-highlighted">{{ row.qualKey }}</h3>
        <UBadge color="neutral" variant="subtle" size="sm">
          {{ row.total }} pilots
        </UBadge>
      </div>
    </template>

    <div class="space-y-3">
      <!-- CA / FO counts -->
      <div class="flex items-center gap-4 text-sm">
        <div class="flex items-center gap-1">
          <span class="text-[var(--ui-text-muted)]">CA:</span>
          <span class="font-mono font-medium">{{ row.caCount }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[var(--ui-text-muted)]">FO:</span>
          <span class="font-mono font-medium">{{ row.foCount }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[var(--ui-text-muted)]">CA:FO:</span>
          <span class="font-mono font-medium">{{ row.caFoRatio.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Base breakdown horizontal bar -->
      <div v-if="row.byBase.length > 0" class="space-y-1">
        <p class="text-xs text-[var(--ui-text-muted)]">By Base</p>
        <div class="flex h-4 w-full overflow-hidden rounded-full bg-[var(--ui-bg-muted)]">
          <div
            v-for="(baseItem, idx) in row.byBase"
            :key="baseItem.base"
            :style="{ width: `${baseItem.pct}%`, backgroundColor: baseColors[idx % baseColors.length] }"
            :title="`${baseItem.base}: ${baseItem.count} (${baseItem.pct}%)`"
            class="transition-all"
          />
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1">
          <div
            v-for="(baseItem, idx) in row.byBase"
            :key="baseItem.base"
            class="flex items-center gap-1 text-xs"
          >
            <span
              class="inline-block size-2 rounded-full"
              :style="{ backgroundColor: baseColors[idx % baseColors.length] }"
            />
            <span>{{ baseItem.base }}</span>
            <span class="text-[var(--ui-text-muted)]">{{ baseItem.pct }}%</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  row: {
    qualKey: string
    fleet: string
    seat: string
    total: number
    caCount: number
    foCount: number
    caFoRatio: number
    byBase: { base: string; count: number; pct: number }[]
  }
  selected: boolean
}>()

defineEmits<{ select: [] }>()

// Distinct colors for base segments using CSS variables
const baseColors = [
  'var(--ui-color-sky-400)',
  'var(--ui-color-indigo-400)',
  'var(--ui-color-teal-400)',
  'var(--ui-color-amber-400)',
  'var(--ui-color-rose-400)',
  'var(--ui-color-violet-400)',
]
</script>
