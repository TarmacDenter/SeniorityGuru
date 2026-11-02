<script setup lang="ts">
import type { RecentListItem } from '~/composables/seniority'

// The latest uploads at a glance. Editing and deleting stay in the lists table, which confirms first.
defineProps<{
  lists: RecentListItem[]
}>()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">Recent Lists</h2>
    </template>

    <ul class="divide-y divide-(--ui-border)">
      <li v-for="list in lists" :key="list.id" class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
        <UIcon :name="list.icon" class="text-lg text-muted shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted truncate">{{ list.title }}</p>
          <p class="text-xs text-muted">{{ list.description }} · uploaded {{ list.date }}</p>
        </div>
      </li>
    </ul>
  </UCard>
</template>
