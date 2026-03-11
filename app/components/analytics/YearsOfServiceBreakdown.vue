<template>
  <div>
    <UTable :rows="tableRows" :columns="columns">
      <template #value-cell="{ row }">
        <span :class="row.isUser ? 'font-semibold text-primary' : ''">
          {{ row.value }}
        </span>
      </template>
      <template #label-cell="{ row }">
        <span :class="row.isUser ? 'font-semibold text-primary' : ''">
          {{ row.label }}
        </span>
      </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  distribution: {
    entryFloor: number
    p25: number
    median: number
    p75: number
    max: number
  }
  userYos: number | undefined
}>()

const columns = [
  { key: 'label', label: 'Metric' },
  { key: 'value', label: 'Years of Service' },
]

const tableRows = computed(() => {
  const rows = [
    { label: 'Entry Floor (Most Junior)', value: `${props.distribution.entryFloor.toFixed(1)} yrs`, isUser: false },
    { label: 'P25', value: `${props.distribution.p25.toFixed(1)} yrs`, isUser: false },
    { label: 'Median (P50)', value: `${props.distribution.median.toFixed(1)} yrs`, isUser: false },
    { label: 'P75', value: `${props.distribution.p75.toFixed(1)} yrs`, isUser: false },
    { label: 'Max (Most Senior)', value: `${props.distribution.max.toFixed(1)} yrs`, isUser: false },
  ]

  if (props.userYos !== undefined) {
    rows.push({
      label: 'Your YOS',
      value: `${props.userYos.toFixed(1)} yrs`,
      isUser: true,
    })
  }

  return rows
})
</script>
