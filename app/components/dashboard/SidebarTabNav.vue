<script setup lang="ts">
import { useDashboardTabs } from '~/composables/useDashboardTabs'
import type { DashboardTab } from '~/utils/dashboard-tabs'

const route = useRoute()
const { tabs, activeTab } = useDashboardTabs()
const sidebarOpen = useState<boolean>('dashboardSidebarOpen', () => false)

const isDashboardRoute = computed(() => route.path === '/dashboard')

function selectTab(value: string) {
  activeTab.value = value as DashboardTab
  // Close the sidebar so the user immediately sees the selected tab content
  sidebarOpen.value = false
}
</script>

<template>
  <!-- Only rendered on mobile (sm:hidden) and only on the /dashboard route -->
  <div v-if="isDashboardRoute" class="sm:hidden border-t border-[var(--ui-border)] mt-2 pt-2 px-2">
    <p class="text-[10px] font-semibold text-[var(--ui-text-muted)] uppercase tracking-wide px-2 mb-1">
      Dashboard views
    </p>
    <button
      v-for="tab in tabs"
      :key="tab.value as string"
      class="flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm text-left transition-colors"
      :class="activeTab === tab.value
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]'"
      @click="selectTab(tab.value as string)"
    >
      <UIcon :name="tab.icon as string" class="size-4 shrink-0" />
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>
