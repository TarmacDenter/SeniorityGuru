<script setup lang="ts">
const { githubUrl, mailtoUrl } = useImportPluginRequest()

const lists = [
  { icon: 'selfhst:delta-air-lines', name: 'Delta', summary: 'PBS seniority list exports' },
  { icon: 'simple-icons:jetblue', name: 'jetBlue', summary: 'Quarterly seniority publication, CSV or XLSX' },
  { icon: 'i-lucide-file-spreadsheet', name: 'Generic CSV/XLSX', summary: 'Any spreadsheet with column headers' },
]
</script>

<template>
  <div class="space-y-4">
    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Supported seniority lists">
      <li v-for="list in lists" :key="list.name" class="flex items-center gap-3">
        <UIcon :name="list.icon" class="size-6 shrink-0 text-highlighted" />
        <div>
          <h3 class="font-semibold text-highlighted">{{ list.name }}</h3>
          <p class="text-sm text-muted">{{ list.summary }}</p>
        </div>
      </li>
    </ul>

    <div class="flex flex-wrap items-center gap-2">
      <UButton to="/how-it-works#data-compatibility" label="Required format" color="neutral" variant="link" trailing-icon="i-lucide-arrow-right" class="px-0" />
      <UButton :to="githubUrl" target="_blank" label="Request an Import Plugin" color="neutral" variant="outline" size="sm" icon="i-lucide-github" />
      <UButton :to="mailtoUrl" label="Email me" color="neutral" variant="outline" size="sm" icon="i-lucide-mail" />
    </div>
  </div>
</template>
