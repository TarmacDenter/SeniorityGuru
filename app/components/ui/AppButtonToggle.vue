<script setup lang="ts">
const props = defineProps<{
  options: { label: string; value: string }[]
}>()

const model = defineModel<string>({ required: true })

function roundingClass(index: number): string {
  if (props.options.length === 1) return ''
  if (index === 0) return 'rounded-r-none'
  if (index === props.options.length - 1) return 'rounded-l-none'
  return 'rounded-none'
}
</script>

<template>
  <div class="inline-flex">
    <UButton
      v-for="(option, i) in options"
      :key="option.value"
      size="xs"
      :variant="model === option.value ? 'solid' : 'ghost'"
      :class="roundingClass(i)"
      @click="model = option.value"
    >
      <slot name="option-label" :option="option">{{ option.label }}</slot>
    </UButton>
  </div>
</template>
