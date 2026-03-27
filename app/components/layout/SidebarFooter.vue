<script setup lang="ts">
const { install, standalone } = usePwaInstall()
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="flex flex-col gap-2 p-2 overflow-hidden">
    <SupportModal :collapsed="collapsed" />
    <UButton
      v-if="!standalone"
      icon="i-lucide-download"
      :label="collapsed ? undefined : 'Install App'"
      variant="ghost"
      color="neutral"
      size="sm"
      :block="!collapsed"
      :class="collapsed ? 'justify-center' : ''"
      @click="install"
    />
    <div class="flex items-center" :class="collapsed ? 'justify-center' : 'justify-end'">
      <UDashboardSidebarCollapse />
    </div>
  </div>
</template>
