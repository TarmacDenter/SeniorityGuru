<script setup lang="ts">
const navItems = useSeniorityNav()
const sidebarOpen = useState<boolean>('dashboardSidebarOpen', () => false)
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar v-model:open="sidebarOpen" collapsible resizable>
      <template #header="{ collapsed }">
        <SidebarLogo :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          orientation="vertical"
          :items="navItems"
          highlight
          color="primary"
          :ui="{ link: collapsed ? 'justify-center' : undefined }"
          class="p-2 flex-1"
        />
        <!-- Mobile-only: dashboard tab shortcuts in sidebar, hidden when sidebar is collapsed -->
        <DashboardSidebarTabNav v-if="!collapsed" />
      </template>

      <template #footer="{ collapsed }">
        <SidebarFooter :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
