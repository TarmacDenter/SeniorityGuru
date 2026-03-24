<script setup lang="ts">
const config = useRuntimeConfig()
const bmcUrl = config.public.bmcUrl as string
const feedbackEmail = config.public.feedbackEmail as string
const mailtoHref = `mailto:${feedbackEmail}?subject=SeniorityGuru%20Feature%20Suggestion`

defineProps<{
  collapsed?: boolean
}>()

defineExpose({ bmcUrl, mailtoHref })
</script>

<template>
  <UModal title="Support & Feedback">
    <UButton
      icon="i-lucide-heart"
      color="neutral"
      variant="ghost"
      :label="collapsed ? undefined : 'Support'"
      :aria-label="collapsed ? 'Support & Feedback' : undefined"
      class="w-full"
      :class="collapsed ? 'justify-center' : ''"
    />

    <template #body>
      <div class="flex flex-col gap-3">
        <UButton
          :to="bmcUrl"
          target="_blank"
          rel="noopener noreferrer"
          icon="i-lucide-coffee"
          label="Buy Me a Coffee"
          color="warning"
          variant="solid"
          class="w-full justify-center"
        />
        <UButton
          :to="mailtoHref"
          icon="i-lucide-message-square"
          label="Suggest a Feature"
          color="neutral"
          variant="outline"
          class="w-full justify-center"
        />
      </div>
    </template>
  </UModal>
</template>
