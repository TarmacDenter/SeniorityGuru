<template>
  <div class="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-2.5 bg-[var(--ui-bg)] border-b border-[var(--ui-border)] flex-wrap">
    <span class="text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wide">Growth assumption</span>
    <USwitch v-model="enabled" size="xs" />
    <template v-if="enabled">
      <USlider v-model="sliderValue" :min="1" :max="20" :step="1" class="w-32" />
      <UBadge color="primary" variant="subtle" size="sm" class="font-mono">
        {{ (sliderValue * 0.5).toFixed(1) }}%/yr
      </UBadge>
    </template>
    <span v-else class="text-xs text-[var(--ui-text-muted)]">Retirements only</span>
    <InfoIcon
      text="Adds simulated new hires each year via compound growth. Dilutes your percentile — does not affect your raw rank."
      size="xs"
      class="ml-1"
    />
  </div>
</template>

<script setup lang="ts">
import type { GrowthConfig } from '#shared/types/growth-config'

const props = defineProps<{ modelValue: GrowthConfig }>()
const emit = defineEmits<{ 'update:modelValue': [config: GrowthConfig] }>()

const enabled = ref(props.modelValue.enabled)
const sliderValue = ref(Math.round(props.modelValue.annualRate / 0.005))
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(enabled, (on) => {
  emit('update:modelValue', { annualRate: props.modelValue.annualRate, enabled: on })
})

watch(sliderValue, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', { enabled: props.modelValue.enabled, annualRate: val * 0.005 })
  }, 500)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
