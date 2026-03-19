<script setup lang="ts">
import { useSeniorityStore } from '~/stores/seniority'

interface ListItem {
  id: string
  title: string
  description: string
  icon: string
  date: string
}

defineProps<{
  lists: ListItem[]
}>()

const seniorityStore = useSeniorityStore()
const toast = useToast()
const deletingId = ref<string | null>(null)

async function confirmDelete(list: ListItem) {
  deletingId.value = list.id
  try {
    await seniorityStore.deleteList(list.id)
    toast.add({ title: 'List deleted', description: list.title, color: 'success' })
  }
  catch {
    toast.add({ title: 'Failed to delete list', color: 'error' })
  }
  finally {
    deletingId.value = null
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">Recent Lists</h3>
    </template>

    <ul class="divide-y divide-(--ui-border)">
      <li v-for="list in lists" :key="list.id" class="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
        <div class="flex items-center gap-3 min-w-0">
          <UIcon :name="list.icon" class="text-lg text-muted shrink-0" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-highlighted truncate">{{ list.title }}</p>
            <p class="text-xs text-muted">{{ list.description }} - {{ list.date }}</p>
          </div>
        </div>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          :loading="deletingId === list.id"
          @click="confirmDelete(list)"
        />
      </li>
    </ul>
  </UCard>
</template>
