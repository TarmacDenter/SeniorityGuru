<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { changelogPage, markAsSeen } = useChangelog()

onMounted(() => {
  markAsSeen()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="What's New" />
    </template>

    <template #body>
      <div class="max-w-2xl mx-auto p-4 sm:p-6">
        <ContentRenderer
          v-if="changelogPage"
          :value="changelogPage"
          class="prose prose-sm dark:prose-invert max-w-none"
        />
        <div
          v-else
          class="flex justify-center py-12"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="size-6 animate-spin text-(--ui-text-muted)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
