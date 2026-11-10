<script setup lang="ts">
const items = [
  {
    icon: 'i-lucide-plane',
    title: 'Use your airline\'s data',
    description: 'Open the seniority spreadsheet you already have. No special access or airline account needed.',
  },
  {
    icon: 'i-lucide-hard-drive',
    title: 'Local data',
    description: 'Your lists stay in your browser. SeniorityGuru does not receive them.',
  },
  {
    icon: 'i-lucide-user-x',
    title: 'No account',
    description: 'Use the app without creating an account or entering an email address.',
  },
]
</script>

<template>
  <ul class="grid grid-cols-1 gap-6 sm:grid-cols-3" aria-label="Privacy">
    <li v-for="item in items" :key="item.title" class="flex gap-3">
      <UIcon :name="item.icon" class="mt-0.5 size-5 shrink-0 text-highlighted" />
      <div>
        <h3 class="font-semibold text-highlighted">{{ item.title }}</h3>
        <p class="text-sm text-muted">{{ item.description }}</p>
      </div>
    </li>
  </ul>
</template>
