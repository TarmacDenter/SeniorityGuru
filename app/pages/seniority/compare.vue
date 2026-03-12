<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Compare Lists">
        <template #right>
          <div class="flex flex-wrap items-center gap-3">
            <UFormField label="Older List" class="w-full sm:w-56">
              <USelectMenu
                v-model="listIdA"
                :items="listOptions"
                value-key="value"
                placeholder="Select list..."
              />
            </UFormField>
            <UIcon name="i-lucide-arrow-right" class="hidden sm:block text-(--ui-text-muted)" />
            <UFormField label="Newer List" class="w-full sm:w-56">
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
            <ComparisonTab :data="comparison.retired" :columns="retiredColumns" search-placeholder="Search retired..." />
          </template>
          <template #departed>
            <ComparisonTab :data="comparison.departed" :columns="departedColumns" search-placeholder="Search departed..." />
          </template>
          <template #qual-moves>
            <ComparisonTab :data="comparison.qualMoves" :columns="qualMoveColumns" :filters="qualMoveFilters" search-placeholder="Search qual moves..." />
          </template>
          <template #rank-changes>
            <ComparisonTab :data="comparison.rankChanges" :columns="rankChangeColumns" search-placeholder="Search rank changes..." />
          </template>
          <template #new-hires>
            <ComparisonTab :data="comparison.newHires" :columns="newHireColumns" search-placeholder="Search new hires..." />
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
import { useSeniorityStore } from '~/stores/seniority'
import { retiredColumns, departedColumns, qualMoveColumns, rankChangeColumns, newHireColumns, qualMoveFilters } from '~/utils/column-definitions'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

const seniorityStore = useSeniorityStore()
const route = useRoute()

const listIdA = ref<string | undefined>((route.query.a as string) || undefined)
const listIdB = ref<string | undefined>((route.query.b as string) || undefined)

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
    listIdA.value = seniorityStore.lists[1]!.id // second most recent = older
    listIdB.value = seniorityStore.lists[0]!.id // most recent = newer
  }
})

const listOptions = computed(() =>
  seniorityStore.lists.map(l => ({
    label: l.title ? `${l.title} — ${l.effective_date}` : l.effective_date,
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

</script>
