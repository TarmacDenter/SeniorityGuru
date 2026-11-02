<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <USwitch v-bind="$attrs" v-model="model" />
    <span
      data-testid="switch-state"
      class="w-6 font-mono text-xs font-semibold"
      :class="model ? 'text-highlighted' : 'text-muted'"
    >{{ model ? 'On' : 'Off' }}</span>
  </div>
</template>
