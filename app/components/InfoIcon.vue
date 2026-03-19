<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string
    size?: 'xs' | 'sm' | 'md'
  }>(),
  { size: 'sm' },
)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'size-3'
    case 'md': return 'size-5'
    case 'sm':
    default: return 'size-4'
  }
})
</script>

<template>
  <UTooltip :text="text">
    <UIcon
      name="i-heroicons-information-circle"
      :class="[sizeClass, 'text-[--ui-text-muted] cursor-help']"
    />
  </UTooltip>
</template>

<style scoped>
/* inline-flex so the icon aligns with surrounding text */
:deep(span),
span {
  display: inline-flex;
  align-items: baseline;
}
</style>
