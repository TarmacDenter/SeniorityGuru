<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
  { label: 'Lists', icon: 'i-lucide-list', to: '/seniority/lists' },
  { label: 'Upload', icon: 'i-lucide-upload', to: '/seniority/upload' },
  { label: 'Compare', icon: 'i-lucide-git-compare-arrows', to: '/seniority/compare' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <nav
    class="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-(--ui-bg) border-t border-(--ui-border) flex"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs transition-colors"
      :class="isActive(item.to) ? 'text-primary' : 'text-(--ui-text-muted)'"
    >
      <UIcon :name="item.icon" class="size-5" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
