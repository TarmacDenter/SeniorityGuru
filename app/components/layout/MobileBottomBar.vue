<script setup lang="ts">
// Phone navigation: the four dashboard sections, plus More for Upload, Compare and Settings.
const nav = useSeniorityNav()
const sections = computed(() => nav.value[0] ?? [])
const actions = computed(() => nav.value[1] ?? [])
const { hasUnseenChanges } = useChangelog()
const moreOpen = ref(false)
</script>

<template>
  <nav class="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-(--ui-bg) border-t border-(--ui-border) flex pb-[env(safe-area-inset-bottom)]" aria-label="Sections">
    <NuxtLink
      v-for="item in sections"
      :key="item.label"
      :to="item.to"
      class="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs transition-colors"
      :class="item.active ? 'text-primary' : 'text-(--ui-text-muted)'"
      :aria-current="item.active ? 'page' : undefined"
    >
      <UIcon :name="item.icon!" class="size-5" />
      <span>{{ item.label }}</span>
    </NuxtLink>

    <UDrawer v-model:open="moreOpen" title="More" :ui="{ body: 'pb-[calc(1rem+env(safe-area-inset-bottom))]' }">
      <button
        type="button"
        class="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs transition-colors"
        :class="actions.some(item => item.active) ? 'text-primary' : 'text-(--ui-text-muted)'"
        :aria-label="hasUnseenChanges ? 'More, with unseen updates' : undefined"
      >
        <span class="relative flex">
          <UIcon name="i-lucide-ellipsis" class="size-5" />
          <span v-if="hasUnseenChanges" class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
        </span>
        <span>More</span>
      </button>

      <template #body>
        <ul class="divide-y divide-default">
          <li v-for="item in actions" :key="item.label">
            <NuxtLink
              :to="item.to"
              class="flex min-h-12 items-center gap-3 px-1 text-base"
              :class="item.active ? 'text-primary' : 'text-default'"
              :aria-current="item.active ? 'page' : undefined"
              @click="moreOpen = false"
            >
              <UIcon :name="item.icon!" class="size-5" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </template>
    </UDrawer>
  </nav>
</template>
