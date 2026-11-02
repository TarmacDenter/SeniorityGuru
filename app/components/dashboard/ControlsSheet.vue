<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { SHORT_VIEWPORT_QUERY, useDashboardControlsHost } from '~/composables/useDashboardControls'

// The Controls button and the sheet it opens, in the header bar. A popover in landscape (short), a bottom
// drawer in portrait. Both hold one empty body; `DashboardControls` teleports the view's controls into it.
const host = useDashboardControlsHost()
const short = useMediaQuery(SHORT_VIEWPORT_QUERY)
const open = ref(false)

const visible = computed(() => !!host && host.compact.value && host.count.value > 0)
function bindOutlet(el: unknown) {
  if (host) host.outlet.value = (el as HTMLElement | null) ?? null
}
</script>

<template>
  <template v-if="visible">
    <UPopover v-if="short" v-model:open="open" :content="{ align: 'end' }">
      <UButton icon="i-lucide-sliders-horizontal" label="Controls" color="neutral" variant="outline" size="sm" />
      <template #content>
        <div class="max-h-[70vh] w-[min(24rem,90vw)] overflow-y-auto p-4">
          <div :ref="bindOutlet" data-testid="controls-outlet" />
        </div>
      </template>
    </UPopover>

    <UDrawer
      v-else
      v-model:open="open"
      title="Controls"
      description="Settings for this view"
      :ui="{ description: 'sr-only' }"
    >
      <UButton icon="i-lucide-sliders-horizontal" label="Controls" color="neutral" variant="outline" size="sm" />
      <template #body>
        <div :ref="bindOutlet" data-testid="controls-outlet" />
      </template>
    </UDrawer>
  </template>
</template>
