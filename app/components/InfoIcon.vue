<template>
  <UTooltip :text="text">
    <UIcon
      name="i-lucide-info"
      :class="[sizeClass, 'text-[var(--ui-text-muted)] cursor-help shrink-0']"
    />
  </UTooltip>
</template>

<script setup lang="ts">
const props = defineProps<{
  text: string
  size?: 'xs' | 'sm' | 'md'
}>()

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'size-3'
    case 'md': return 'size-5'
    default: return 'size-4'
  }
})
</script>
