<script setup lang="ts">
const { hasUnseenChanges } = useChangelog()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="font-semibold">
            What's New
          </h2>
          <span
            v-if="hasUnseenChanges"
            class="size-2 rounded-full bg-primary"
            aria-label="Unseen updates"
          />
        </div>
        <UButton
          to="/whats-new"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-right"
          size="sm"
        />
      </div>
    </template>

    <p class="text-sm text-(--ui-text-muted)">
      See the latest features, improvements, and fixes.
    </p>
  </UCard>
</template>
