<script setup lang="ts">
defineProps<{
  fleets: string[]
  seats: string[]
  bases: string[]
}>()

const fleet = defineModel<string | null>('fleet', { default: null })
const seat = defineModel<string | null>('seat', { default: null })
const base = defineModel<string | null>('base', { default: null })

function clear() {
  fleet.value = null
  seat.value = null
  base.value = null
}

function selection(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}
</script>

<template>
  <div class="flex gap-3 flex-wrap items-center">
    <USelect :model-value="fleet ?? undefined" :items="fleets" placeholder="All Fleets" class="w-full sm:w-40" @update:model-value="fleet = selection($event)" />
    <USelect :model-value="seat ?? undefined" :items="seats" placeholder="All Seats" class="w-full sm:w-40" @update:model-value="seat = selection($event)" />
    <USelect :model-value="base ?? undefined" :items="bases" placeholder="All Bases" class="w-full sm:w-40" @update:model-value="base = selection($event)" />
    <UButton v-if="fleet || seat || base" size="sm" color="neutral" variant="ghost" icon="i-lucide-x" @click="clear">Clear filter</UButton>
  </div>
</template>
