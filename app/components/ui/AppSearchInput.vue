<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ default: '' })

defineProps<{
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>()
</script>

<template>
  <UInput
    v-model="model"
    icon="i-lucide-search"
    v-bind="$attrs"
    :placeholder="placeholder"
    :size="size"
  >
    <template v-if="model" #trailing>
      <UButton
        icon="i-lucide-x"
        variant="link"
        color="neutral"
        size="xs"
        aria-label="Clear search"
        @click="model = ''"
      />
    </template>
  </UInput>
</template>
