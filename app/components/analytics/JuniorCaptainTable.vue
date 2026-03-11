<template>
  <UTable :rows="tableRows" :columns="columns">
    <template #fleet-cell="{ row }">
      <div class="flex items-center gap-2">
        <span>{{ row.fleet }}</span>
        <span
          v-if="row.isHoldable"
          class="inline-block size-2 rounded-full bg-[var(--ui-color-success-500)]"
          title="You could hold this"
        />
      </div>
    </template>
    <template #yos-cell="{ row }">
      {{ row.yos.toFixed(1) }} yrs
    </template>
    <template #hireDate-cell="{ row }">
      {{ row.hireDate }}
    </template>
  </UTable>
</template>

<script setup lang="ts">
const props = defineProps<{
  rows: { fleet: string; seniorityNumber: number; hireDate: string; yos: number }[]
  userSeniorityNumber: number | undefined
}>()

const tableRows = computed(() =>
  props.rows.map((r) => ({
    ...r,
    isHoldable:
      props.userSeniorityNumber !== undefined &&
      props.userSeniorityNumber <= r.seniorityNumber,
  })),
)

const columns = [
  { key: 'fleet', label: 'Fleet' },
  { key: 'seniorityNumber', label: 'Sen #' },
  { key: 'hireDate', label: 'Hire Date' },
  { key: 'yos', label: 'YOS' },
]
</script>
