<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">Recent Lists</h3>
    </template>

    <UTimeline :items="timelineItems" />
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  lists: Array<{
    title: string
    description: string
    icon: string
    date: string
  }>
}>()

const timelineItems = computed(() =>
  props.lists.map(list => ({
    title: list.title,
    description: `${list.description} - ${list.date}`,
    icon: list.icon
  }))
)
</script>
