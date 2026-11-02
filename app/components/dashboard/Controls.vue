<script setup lang="ts">
import { useDashboardControlsHost } from '~/composables/useDashboardControls'

// Wraps a view's controls. Inline on desktop and wherever no shell hosts a sheet; on a compact screen the
// content moves into the shell's controls sheet (and is absent while the sheet is closed).
// The slot's `sheet` flag lets the controls drop their bar styling when they sit in the sheet.
const host = useDashboardControlsHost()
const sheet = computed(() => !!host?.compact.value)
const target = computed(() => host?.outlet.value ?? null)

onMounted(() => { if (host) host.count.value++ })
onBeforeUnmount(() => { if (host) host.count.value-- })
</script>

<template>
  <slot v-if="!sheet" :sheet="false" />
  <Teleport v-else-if="target" :to="target">
    <slot :sheet="true" />
  </Teleport>
</template>
