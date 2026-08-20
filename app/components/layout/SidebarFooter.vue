<script setup lang="ts">
const { install, standalone } = usePwaInstall()
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="sidebar-footer flex flex-col gap-2 overflow-hidden"
    :class="collapsed ? 'items-center is-collapsed' : 'is-expanded'">
    <ShareButton v-if="!collapsed" color="neutral">Share SeniorityGuru!</ShareButton>
    <ShareButton v-else color="neutral" class="size-8 shrink-0 justify-center" />
    <SupportModal :collapsed="collapsed" />
    <UButton v-if="!standalone" icon="i-lucide-download" :label="collapsed ? undefined : 'Install App'" variant="ghost"
      color="neutral" size="sm" :block="!collapsed"
      :class="collapsed ? 'size-8 shrink-0 justify-center' : 'justify-start'" @click="install" />
    <UDashboardSidebarCollapse />
  </div>
</template>

<style scoped>
.sidebar-footer> :last-child {
  justify-content: flex-start !important;
}

.sidebar-footer.is-collapsed> :last-child {
  justify-content: center !important;
}
</style>
