<script setup lang="ts">
import { getLogBuffer, exportLogAsText } from '~/utils/logger'

const entryCount = computed(() => getLogBuffer().length)

function downloadLog() {
  const text = exportLogAsText()
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `seniority-guru-debug-${timestamp}.txt`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-semibold">Debug Log</h2>
        <UBadge
          v-if="entryCount > 0"
          :label="String(entryCount)"
          size="sm"
          variant="subtle"
          color="neutral"
        />
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-muted">
        Download the session debug log to include with bug reports. Logs are cleared on page refresh.
      </p>

      <UButton
        icon="i-lucide-download"
        :disabled="entryCount === 0"
        variant="outline"
        color="neutral"
        @click="downloadLog"
      >
        Download Debug Log
      </UButton>
    </div>
  </UCard>
</template>
