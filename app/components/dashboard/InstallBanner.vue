<script setup lang="ts">
import { usePwaInstall } from '~/composables/usePwaInstall'

const { showBanner, isIos, showIosModal, install, snooze, dismiss } = usePwaInstall()
</script>

<template>
  <div v-if="showBanner" class="px-4 pt-4">
    <UAlert
      icon="i-lucide-smartphone"
      color="primary"
      variant="subtle"
      title="Install Seniority Guru"
      description="Get the full app experience and keep your data safe — installed apps get reliable local storage that browsers won't clear."
    >
      <template #actions>
        <UButton size="sm" color="primary" @click="install">
          {{ isIos ? 'How to Install' : 'Install' }}
        </UButton>
        <UButton size="sm" variant="ghost" color="neutral" @click="snooze">
          Not now
        </UButton>
        <UButton size="xs" variant="ghost" color="neutral" @click="dismiss">
          Don't ask again
        </UButton>
      </template>
    </UAlert>
  </div>

  <UModal
    v-if="isIos"
    v-model:open="showIosModal"
    title="Install Seniority Guru"
    description="Add to your home screen in a few steps"
  >
    <template #body>
      <ol class="space-y-5 text-sm">
        <li class="flex items-start gap-3">
          <UIcon name="i-lucide-share" class="size-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p class="font-medium">Tap the Share button</p>
            <p class="text-muted mt-0.5">The share icon is at the bottom of your Safari toolbar.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <UIcon name="i-lucide-square-plus" class="size-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p class="font-medium">Tap "Add to Home Screen"</p>
            <p class="text-muted mt-0.5">Scroll down in the share sheet to find this option.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <UIcon name="i-lucide-check-circle" class="size-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p class="font-medium">Tap "Add"</p>
            <p class="text-muted mt-0.5">Seniority Guru will appear on your home screen as a standalone app with persistent storage.</p>
          </div>
        </li>
      </ol>
    </template>
  </UModal>
</template>
