<template>
  <div v-if="!isBannerDismissed" class="mb-4">
    <UAlert
      icon="i-lucide-info"
      color="neutral"
      variant="subtle"
      title="Projection Assumptions"
      description="These projections are based solely on scheduled retirements from the current seniority list. They do not account for new hires, pilot upgrades or downgrades, base size changes, furloughs, or non-retirement attrition. Treat all figures as directional estimates, not guarantees."
    >
      <template #actions>
        <UButton size="xs" variant="ghost" color="neutral" @click="$emit('dismiss')">
          Dismiss
        </UButton>
      </template>
    </UAlert>
  </div>
  <div v-else class="mb-4 text-xs text-[var(--ui-text-muted)] flex items-center gap-1">
    <UIcon name="i-lucide-info" class="size-3" />
    Projections based on scheduled retirements only.
    <UButton size="xs" variant="link" color="neutral" class="p-0 h-auto" @click="$emit('dismiss')">
      Details
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineProps<{ isBannerDismissed: boolean; context?: string }>()
defineEmits<{ dismiss: [] }>()
</script>
