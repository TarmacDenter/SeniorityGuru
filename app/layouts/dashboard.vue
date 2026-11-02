<script setup lang="ts">
const navItems = useSeniorityNav();
const sidebarOpen = useState<boolean>('dashboardSidebarOpen', () => false); // shared with nav composable
</script>

<template>
  <UDashboardGroup>
    <div class="hidden sm:contents">
      <UDashboardSidebar v-model:open="sidebarOpen" collapsible resizable>
        <template #header="{ collapsed }">
          <SidebarLogo :collapsed="collapsed" />
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu orientation="vertical" :items="navItems" highlight color="primary" :ui="{
            link: collapsed ? 'justify-center' : undefined,
            linkLeadingIcon: 'size-5 shrink-0',
            childLinkIcon: 'size-5 shrink-0'
          }" class="flex-1" />
        </template>

        <template #footer="{ collapsed }">
          <SidebarFooter :collapsed="collapsed" />
        </template>
      </UDashboardSidebar>
    </div>

    <!-- On phones the fixed bottom bar owns the last 4rem: the panel ends above it
         (min-h-0 overrides the panel's min-h-svh) so its own scroller never runs under the bar. -->
    <div
      class="flex flex-col flex-1 min-w-0 overflow-y-auto sm:overflow-hidden max-sm:mb-[calc(4rem+env(safe-area-inset-bottom))] max-sm:[&>*]:min-h-0!">
      <slot />
    </div>

    <MobileBottomBar />
  </UDashboardGroup>
</template>
