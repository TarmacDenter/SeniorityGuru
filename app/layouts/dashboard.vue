<script setup lang="ts">
const navItems = useSeniorityNav()
const sidebarOpen = useState<boolean>('dashboardSidebarOpen', () => false) // shared with nav composable
</script>

<template>
  <UDashboardGroup>
    <div class="hidden sm:contents">
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
    </div>

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden pb-16 sm:pb-0">
      <DashboardInstallBanner />
      <slot />
    </div>

    <MobileBottomBar />
  </UDashboardGroup>
</template>
