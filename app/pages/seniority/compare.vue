<script setup lang="ts">
import { useSeniorityCompare, useSeniorityLists } from '~/composables/seniority'
import { retiredColumns, departedColumns, qualMoveColumns, rankChangeColumns, newHireColumns, qualMoveFilters } from '~/utils/column-definitions'
import { buildDiffRows } from '~/utils/build-diff-rows'

definePageMeta({
  layout: 'dashboard',
})

const { lists, listOptions, fetchLists } = useSeniorityLists()
const { employeeNumber } = useUser()
const route = useRoute()

const userEmployeeNumber = computed(() => employeeNumber.value ?? undefined)

const listIdA = ref<number | undefined>(route.query.a ? Number(route.query.a) : undefined)
const listIdB = ref<number | undefined>(route.query.b ? Number(route.query.b) : undefined)

const { loading, error, comparison } = useSeniorityCompare(listIdA, listIdB)

const diffRows = computed(() =>
  comparison.value ? buildDiffRows(comparison.value, { includeRankChanges: true }) : [],
)

// Keep query params in sync — only for user-initiated changes after mount.
// When onMounted sets defaults, oldA and oldB are both undefined → guard skips.
watch([listIdA, listIdB], async ([a, b], [oldA, oldB]) => {
  if (!oldA && !oldB) return
  const query: Record<string, string> = {}
  if (a) query.a = String(a)
  if (b) query.b = String(b)
  await navigateTo({ path: '/seniority/compare', query }, { replace: true })
})

// Load lists for the selectors
onMounted(async () => {
  await fetchLists()
  // Auto-select most recent two if not already set.
  // Fires watcher but oldA/oldB are both undefined → guard catches it.
  if (!listIdA.value && !listIdB.value && lists.value.length >= 2) {
    listIdA.value = lists.value[1]!.id // second most recent = older
    listIdB.value = lists.value[0]!.id // most recent = newer
  }
})

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

const compareTabs = [
  { label: 'Diff', value: 'diff' },
  { label: 'Retired', value: 'retired' },
  { label: 'Departed', value: 'departed' },
  { label: 'Qual Moves', value: 'qual-moves' },
  { label: 'Rank Changes', value: 'rank-changes' },
  { label: 'New Hires', value: 'new-hires' },
]

const activeCompareTab = ref('diff')

</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Compare Lists" />
    </template>

    <template #body>
    <div class="p-4 space-y-4">
      <!-- List selectors — inside body so they scroll on mobile, never clip behind header -->
      <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
        <UFormField label="Older List" class="w-full sm:w-56">
          <USelectMenu
            v-model="listIdA"
            :items="listOptions"
            value-key="value"
            placeholder="Select list..."
          />
        </UFormField>
        <UIcon name="i-lucide-arrow-right" class="hidden sm:block text-(--ui-text-muted) mb-1.5" />
        <UFormField label="Newer List" class="w-full sm:w-56">
          <USelectMenu
            v-model="listIdB"
            :items="listOptions"
            value-key="value"
            placeholder="Select list..."
          />
        </UFormField>
      </div>
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

        <!-- Tab selector: chip row on mobile, link tabs on desktop -->
        <DashboardTabChips v-model="activeCompareTab" :tabs="compareTabs" />
        <UTabs v-model="activeCompareTab" :items="compareTabs" :content="false" variant="link" class="hidden sm:flex mt-2" />

        <!-- Tab content -->
        <div class="mt-4">
          <ComparisonDiffTab v-if="activeCompareTab === 'diff'" :rows="diffRows" :user-employee-number="userEmployeeNumber" />
          <ComparisonTab v-else-if="activeCompareTab === 'retired'" :data="comparison.retired" :columns="retiredColumns" search-placeholder="Search retired..." />
          <ComparisonTab v-else-if="activeCompareTab === 'departed'" :data="comparison.departed" :columns="departedColumns" search-placeholder="Search departed..." />
          <ComparisonTab v-else-if="activeCompareTab === 'qual-moves'" :data="comparison.qualMoves" :columns="qualMoveColumns" :filters="qualMoveFilters" search-placeholder="Search qual moves..." />
          <ComparisonTab v-else-if="activeCompareTab === 'rank-changes'" :data="comparison.rankChanges" :columns="rankChangeColumns" search-placeholder="Search rank changes..." />
          <ComparisonTab v-else-if="activeCompareTab === 'new-hires'" :data="comparison.newHires" :columns="newHireColumns" search-placeholder="Search new hires..." />
        </div>
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
