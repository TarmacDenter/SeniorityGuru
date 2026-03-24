<script setup lang="ts">
const props = defineProps<{
  tabs: { label?: string; value?: string | number; icon?: string }[]
  modelValue: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="sm:hidden flex overflow-x-auto gap-1.5 px-3 py-2 border-b border-(--ui-border) [&::-webkit-scrollbar]:hidden">
    <button
      v-for="tab in tabs"
      :key="String(tab.value)"
      class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
      :class="String(tab.value) === modelValue
        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
        : 'text-(--ui-text-muted) hover:text-(--ui-text) hover:bg-(--ui-bg-elevated)'"
      @click="emit('update:modelValue', String(tab.value))"
    >
      <UIcon v-if="tab.icon" :name="tab.icon" class="size-3.5" />
      {{ tab.label }}
    </button>
  </div>
</template>
