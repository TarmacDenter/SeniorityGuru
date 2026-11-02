<script setup lang="ts">
const props = defineProps<{
  tabs: { label?: string; value?: string | number; icon?: string }[]
  modelValue: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function move(event: KeyboardEvent, index: number) {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (step === 0) return
  const next = props.tabs[(index + step + props.tabs.length) % props.tabs.length]
  if (next) emit('update:modelValue', String(next.value))
}
</script>

<template>
  <div role="tablist" class="sm:hidden flex overflow-x-auto gap-1.5 px-3 py-2 border-b border-(--ui-border) [&::-webkit-scrollbar]:hidden">
    <button
      v-for="(tab, index) in tabs"
      :key="String(tab.value)"
      role="tab"
      :aria-selected="String(tab.value) === modelValue"
      :tabindex="String(tab.value) === modelValue ? 0 : -1"
      class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
      :class="String(tab.value) === modelValue
        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
        : 'text-(--ui-text-muted) hover:text-(--ui-text) hover:bg-(--ui-bg-elevated)'"
      @click="emit('update:modelValue', String(tab.value))"
      @keydown="move($event, index)"
    >
      <UIcon v-if="tab.icon" :name="tab.icon" class="size-3.5" />
      {{ tab.label }}
    </button>
  </div>
</template>
