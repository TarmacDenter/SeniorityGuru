<script setup lang="ts">
import { useLandingShowcase } from '~/composables/useLandingShowcase'

const { ready, error, diffRows } = useLandingShowcase()
</script>

<template>
  <div v-if="ready">
    <slot :diff-rows="diffRows" />
  </div>
  <p v-else-if="error" class="text-sm text-muted">
    The sample lists could not be loaded.
  </p>
  <div v-else class="space-y-4" aria-busy="true">
    <USkeleton class="h-64 w-full" />
    <USkeleton class="h-40 w-full" />
  </div>
</template>
