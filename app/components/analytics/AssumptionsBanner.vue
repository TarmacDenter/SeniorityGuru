<script setup lang="ts">
withDefaults(
  defineProps<{
    isBannerDismissed: boolean
    context?: 'trajectory' | 'position' | 'general'
  }>(),
  { context: 'general' },
)
defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div v-if="!isBannerDismissed" class="mb-4">
    <UAlert
      icon="i-lucide-info"
      color="neutral"
      variant="subtle"
      title="Projection Assumptions"
    >
      <template #description>
        <p>
          These projections are based solely on scheduled retirements from the current seniority
          list. They do not account for new hires, pilot upgrades or downgrades, base size changes,
          furloughs, or non-retirement attrition. Treat all figures as directional estimates, not
          guarantees.
        </p>

        <template v-if="context === 'trajectory'">
          <p class="mt-2">
            Projection window: up to 30 years from today, or until your retirement date — whichever
            comes first.
          </p>
          <NuxtLink to="/how-it-works#projection-limits" class="text-primary underline text-sm">
            Learn more about projection methodology →
          </NuxtLink>
        </template>

        <template v-else-if="context === 'position'">
          <p class="mt-2">
            Holdability projections use the same retirement-only model — new hires, upgrades, and
            attrition are not modeled.
          </p>
          <NuxtLink to="/how-it-works#holdability" class="text-primary underline text-sm">
            Learn more about holdability →
          </NuxtLink>
        </template>
      </template>

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
