<script setup lang="ts">
import { useImportAttemptsStore } from '~/stores/import-attempts'

const store = useImportAttemptsStore()
onMounted(() => store.load())

function download(attempt: { id: string, pluginId: string }) {
  const data = store.exportAttempt(attempt.id)
  if (!data) return
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `seniority-guru-import-${attempt.pluginId}-${attempt.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <UCard>
    <template #header><h2 class="text-lg font-semibold">Import Diagnostics</h2></template>
    <div class="space-y-3">
      <p class="text-sm text-muted">Diagnostic files include seniority-list data. They stay on this device unless you save and share one.</p>
      <p v-if="store.attempts.length === 0" class="text-sm text-muted">No import diagnostics are stored.</p>
      <div v-for="attempt in store.attempts" :key="attempt.id" class="flex items-center justify-between gap-3">
        <span class="text-sm">{{ attempt.pluginId }} · {{ new Date(attempt.createdAt).toLocaleString() }}</span>
        <div class="flex gap-2">
          <UButton size="xs" variant="outline" @click="download(attempt)">Export</UButton>
          <UButton size="xs" color="error" variant="ghost" @click="store.remove(attempt.id)">Delete</UButton>
        </div>
      </div>
      <UButton v-if="store.attempts.length" size="sm" color="error" variant="outline" @click="store.clear()">Delete all diagnostics</UButton>
    </div>
  </UCard>
</template>
