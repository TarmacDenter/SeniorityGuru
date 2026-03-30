<script setup lang="ts">
import { useDemoBanner } from '~/composables/useDemoBanner'

const { showBanner, dismiss, exit } = useDemoBanner()
</script>

<template>
  <div v-if="showBanner" class="px-4 pt-4">
    <UAlert
      icon="i-lucide-flask-conical"
      color="info"
      variant="subtle"
      title="You're in demo mode"
      description="This is sample data from a fictional airline. Upload your own seniority list to see your real standing."
    >
      <template #actions>
        <UButton size="sm" color="primary" to="/seniority/upload" icon="i-lucide-upload">
          Upload my list
        </UButton>
        <UButton size="sm" variant="ghost" color="neutral" @click="dismiss">
          Dismiss
        </UButton>
        <UButton size="sm" variant="ghost" color="error" @click="exit">
          Exit Demo
        </UButton>
      </template>
    </UAlert>
  </div>
</template>
