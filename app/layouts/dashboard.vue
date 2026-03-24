<script setup lang="ts">
const navItems = useSeniorityNav()
const sidebarOpen = useState<boolean>('dashboardSidebarOpen', () => false) // shared with nav composable
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
      </template>

      <template #footer="{ collapsed }">
        <SidebarFooter :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <DashboardInstallBanner />
      <slot />
    </div>
  </UDashboardGroup>
</template>
