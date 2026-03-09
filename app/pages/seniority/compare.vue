<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Compare Lists">
        <template #right>
          <div class="flex items-center gap-3">
            <UFormField label="Older List" class="w-56">
              <USelectMenu
                v-model="listIdA"
                :items="listOptions"
                value-key="value"
                placeholder="Select list..."
              />
            </UFormField>
            <UIcon name="i-lucide-arrow-right" class="text-(--ui-text-muted)" />
            <UFormField label="Newer List" class="w-56">
              <USelectMenu
                v-model="listIdB"
                :items="listOptions"
                value-key="value"
                placeholder="Select list..."
              />
            </UFormField>
          </div>
        </template>
      </SeniorityNavbar>
    </template>

    <template #body>
    <div class="p-4 space-y-4">
      <UAlert v-if="error" icon="i-lucide-alert-triangle" color="error" :title="error" />

      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-(--ui-text-muted)" />
      </div>

      <template v-else-if="comparison">
        <!-- Summary cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <UCard v-for="stat in summaryStats" :key="stat.label">
            <div class="text-center">
              <p class="text-2xl font-bold" :class="stat.color">{{ stat.count }}</p>
              <p class="text-xs text-(--ui-text-muted)">{{ stat.label }}</p>
            </div>
          </UCard>
        </div>

        <!-- Detail tabs -->
        <UTabs :items="tabs" class="mt-4">
          <template #retired>
            <UTable :data="comparison.retired" :columns="retiredColumns" />
          </template>

          <template #departed>
            <UTable :data="comparison.departed" :columns="departedColumns" />
          </template>

          <template #qual-moves>
            <UTable :data="comparison.qualMoves" :columns="qualMoveColumns" />
          </template>

          <template #rank-changes>
            <UTable :data="comparison.rankChanges" :columns="rankChangeColumns" />
          </template>

          <template #new-hires>
            <UTable :data="comparison.newHires" :columns="newHireColumns" />
          </template>
        </UTabs>
      </template>

      <div v-else-if="!listIdA || !listIdB" class="text-center py-12 text-(--ui-text-muted)">
        <UIcon name="i-lucide-git-compare-arrows" class="size-12 mb-3" />
        <p>Select two lists above to compare</p>
      </div>

      <div v-else-if="listIdA === listIdB" class="text-center py-12 text-(--ui-text-muted)">
        <p>Please select two different lists to compare</p>
      </div>
    </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useSeniorityStore } from '~/stores/seniority'
import type { RetiredPilot, DepartedPilot, QualMove, RankChange, NewHire } from '~/composables/useSeniorityCompare'

definePageMeta({
  middleware: 'auth',
  layout: 'seniority',
})

const seniorityStore = useSeniorityStore()
const route = useRoute()

const listIdA = ref<string | null>((route.query.a as string) || null)
const listIdB = ref<string | null>((route.query.b as string) || null)

const { loading, error, comparison } = useSeniorityCompare(listIdA, listIdB)

// Keep query params in sync
watch([listIdA, listIdB], ([a, b]) => {
  const query: Record<string, string> = {}
  if (a) query.a = a
  if (b) query.b = b
  navigateTo({ path: '/seniority/compare', query }, { replace: true })
})

// Load lists for the selectors
onMounted(async () => {
  if (!seniorityStore.lists.length) {
    await seniorityStore.fetchLists()
  }
  // Auto-select most recent two if not already set
  if (!listIdA.value && !listIdB.value && seniorityStore.lists.length >= 2) {
    listIdA.value = seniorityStore.lists[1].id // second most recent = older
    listIdB.value = seniorityStore.lists[0].id // most recent = newer
  }
})

const listOptions = computed(() =>
  seniorityStore.lists.map(l => ({
    label: `${l.airline} — ${l.effective_date}`,
    value: l.id,
  })),
)

const summaryStats = computed(() => {
  if (!comparison.value) return []
  return [
    { label: 'Retired', count: comparison.value.retired.length, color: 'text-(--ui-text-muted)' },
    { label: 'Departed', count: comparison.value.departed.length, color: 'text-(--ui-warning)' },
    { label: 'Qual Moves', count: comparison.value.qualMoves.length, color: 'text-(--ui-info)' },
    { label: 'Rank Changes', count: comparison.value.rankChanges.length, color: 'text-(--ui-primary)' },
    { label: 'New Hires', count: comparison.value.newHires.length, color: 'text-(--ui-success)' },
  ]
})

const tabs = [
  { label: 'Retired', slot: 'retired' as const },
  { label: 'Departed', slot: 'departed' as const },
  { label: 'Qual Moves', slot: 'qual-moves' as const },
  { label: 'Rank Changes', slot: 'rank-changes' as const },
  { label: 'New Hires', slot: 'new-hires' as const },
]

const retiredColumns: TableColumn<RetiredPilot>[] = [
  { accessorKey: 'seniority_number', header: '#' },
  { accessorKey: 'employee_number', header: 'Employee #' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'retire_date', header: 'Retire Date' },
]

const departedColumns: TableColumn<DepartedPilot>[] = [
  { accessorKey: 'seniority_number', header: '#' },
  { accessorKey: 'employee_number', header: 'Employee #' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'retire_date', header: 'Retire Date' },
]

const qualMoveColumns: TableColumn<QualMove>[] = [
  { accessorKey: 'seniority_number', header: '#' },
  { accessorKey: 'employee_number', header: 'Employee #' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'old_seat', header: 'Old Seat' },
  { accessorKey: 'new_seat', header: 'New Seat' },
  { accessorKey: 'old_fleet', header: 'Old Fleet' },
  { accessorKey: 'new_fleet', header: 'New Fleet' },
  { accessorKey: 'old_base', header: 'Old Base' },
  { accessorKey: 'new_base', header: 'New Base' },
]

const rankChangeColumns: TableColumn<RankChange>[] = [
  { accessorKey: 'employee_number', header: 'Employee #' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'old_rank', header: 'Old Rank' },
  { accessorKey: 'new_rank', header: 'New Rank' },
  {
    accessorKey: 'delta',
    header: 'Change',
    cell: ({ row }) => {
      const d = row.original.delta
      return d > 0 ? `+${d}` : `${d}`
    },
  },
]

const newHireColumns: TableColumn<NewHire>[] = [
  { accessorKey: 'seniority_number', header: '#' },
  { accessorKey: 'employee_number', header: 'Employee #' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'hire_date', header: 'Hire Date' },
]
</script>
