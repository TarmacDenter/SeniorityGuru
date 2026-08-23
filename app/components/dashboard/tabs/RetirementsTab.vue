<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useSeniorityCore } from '~/composables/seniority'
import type { RelativeUpcomingRetirement, UpcomingRetirement } from '~/utils/seniority'
import { addYearsDate } from '~/utils/date'
import { Temporal, todayPlainDate } from '~/utils/temporal'

const { lens, anchoredLens, hasData, hasAnchor, entries } = useSeniorityCore()

// ── Filter state ────────────────────────────────────────────────────────────
const yearsHorizon = ref<1 | 2 | 3 | 5 | number>(2)
const seniorOnly = ref(true)
const filterBase = ref<string | null>(null)
const filterSeat = ref<string | null>(null)
const filterFleet = ref<string | null>(null)

// ── Sort state ───────────────────────────────────────────────────────────────
type SortKey = 'retirementDate' | 'seniorityNumber' | 'rankRelativeToMe'
type SortDir = 'asc' | 'desc'
const sortKey = ref<SortKey>('retirementDate')
const sortDir = ref<SortDir>('asc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

// ── Qualification options ─────────────────────────────────────────────────────────────
const availableBases = computed(() =>
  [...new Set(entries.value.map(e => e.base).filter(Boolean) as string[])].sort(),
)
const availableSeats = computed(() =>
  [...new Set(entries.value.map(e => e.seat).filter(Boolean) as string[])].sort(),
)
const availableFleets = computed(() =>
  [...new Set(entries.value.map(e => e.fleet).filter(Boolean) as string[])].sort(),
)

type SelectItem = { label: string; value: string | null }
const baseItems = computed<SelectItem[]>(() => [
  { label: 'All bases', value: null },
  ...availableBases.value.map(b => ({ label: b, value: b })),
])
const seatItems = computed<SelectItem[]>(() => [
  { label: 'All seats', value: null },
  ...availableSeats.value.map(s => ({ label: s, value: s })),
])
const fleetItems = computed<SelectItem[]>(() => [
  { label: 'All fleets', value: null },
  ...availableFleets.value.map(f => ({ label: f, value: f })),
])

// ── Rows ─────────────────────────────────────────────────────────────────────
type RetirementRow = UpcomingRetirement | RelativeUpcomingRetirement

const rows = computed((): RetirementRow[] => {
  if (!hasData.value || !lens.value) return []

  const filter = {
    through: addYearsDate(todayPlainDate(), yearsHorizon.value),
    qualificationScope: {
      ...(filterBase.value && { base: filterBase.value }),
      ...(filterSeat.value && { seat: filterSeat.value }),
      ...(filterFleet.value && { fleet: filterFleet.value }),
    },
  }
  const raw = anchoredLens.value
    ? anchoredLens.value.relativeUpcomingRetirements({ ...filter, seniorOnly: seniorOnly.value })
    : lens.value.upcomingRetirements(filter)

  return [...raw].sort((a, b) => {
    let cmp = 0
    if (sortKey.value === 'retirementDate') cmp = Temporal.PlainDate.compare(a.retirementDate, b.retirementDate)
    else if (sortKey.value === 'seniorityNumber') cmp = a.seniorityNumber - b.seniorityNumber
    else if (sortKey.value === 'rankRelativeToMe') cmp = (relativeRank(a) - relativeRank(b))
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

function relativeRank(row: RetirementRow): number {
  return 'positionsSeniorToAnchor' in row ? row.positionsSeniorToAnchor : 0
}

const columns = computed((): TableColumn<RetirementRow>[] => {
  const base: TableColumn<RetirementRow>[] = [
    { accessorKey: 'seniorityNumber', header: 'Seniority #' },
    {
      accessorKey: 'qual',
      header: 'Qualification',
      cell: ({ row }) => `${row.original.qualification.base} · ${row.original.qualification.seat} / ${row.original.qualification.fleet}`,
    },
    { accessorKey: 'retirementDate', header: 'Est. Retire Date' },
  ]
  if (hasAnchor.value) {
    base.splice(1, 0, {
      accessorKey: 'rankRelativeToMe',
      header: 'Rank Relative to Me',
      cell: ({ row }) => {
        const v = 'positionsSeniorToAnchor' in row.original ? row.original.positionsSeniorToAnchor : 0
        return v > 0 ? `+${v}` : String(v)
      },
    })
  }
  return base
})

const horizonOptions = [
  { label: '1 year', value: 1 },
  { label: '2 years', value: 2 },
  { label: '3 years', value: 3 },
  { label: '5 years', value: 5 },
]
</script>

<template>
  <div class="space-y-4">
    <!-- Empty state: no list loaded -->
    <UEmpty
      v-if="!hasData"
      icon="i-lucide-calendar-x"
      title="No seniority list loaded"
      description="Import your airline's seniority list to see upcoming retirements."
      :actions="[{ label: 'Import a list', icon: 'i-lucide-upload', to: '/seniority/upload' }]"
      class="py-24"
    />

    <template v-else>
      <!-- Filters row -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Time horizon -->
        <UTabs
          v-model="yearsHorizon"
          :items="horizonOptions"
          :content="false"
          variant="pill"
          size="sm"
        />

        <!-- Senior only toggle -->
        <div class="flex items-center gap-2">
          <USwitch v-model="seniorOnly" :disabled="!hasAnchor" size="sm" />
          <span class="text-sm" :class="!hasAnchor ? 'text-muted' : ''">
            Senior to me only
          </span>
        </div>

        <!-- Qualification filters -->
        <div class="flex items-center gap-2 flex-wrap">
          <USelectMenu
            v-model="filterBase"
            :items="baseItems"
            value-key="value"
            label-key="label"
            placeholder="Base"
            size="sm"
            class="w-28"
          />
          <USelectMenu
            v-model="filterSeat"
            :items="seatItems"
            value-key="value"
            label-key="label"
            placeholder="Seat"
            size="sm"
            class="w-24"
          />
          <USelectMenu
            v-model="filterFleet"
            :items="fleetItems"
            value-key="value"
            label-key="label"
            placeholder="Fleet"
            size="sm"
            class="w-28"
          />
        </div>
      </div>

      <!-- Employee number prompt -->
      <div
        v-if="!hasAnchor"
        class="flex items-center gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-4 py-3 text-sm"
      >
        <UIcon name="i-lucide-user-x" class="size-4 shrink-0 text-muted" />
        <span class="text-muted">
          Set an employee number that appears in this list in
          <NuxtLink to="/settings" class="underline text-primary">Settings</NuxtLink>
          to see rank relative to you and filter by seniority.
        </span>
      </div>

      <!-- Table -->
      <UCard>
        <div class="overflow-x-auto">
        <UTable
          :data="rows"
          :columns="columns"
          :ui="{ th: 'cursor-pointer select-none' }"
        >
          <template #seniorityNumber-header>
            <button class="flex items-center gap-1" @click="toggleSort('seniorityNumber')">
              Seniority #
              <UIcon
                :name="sortKey === 'seniorityNumber' && sortDir === 'desc' ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                :class="sortKey === 'seniorityNumber' ? 'text-primary' : 'text-muted'"
                class="size-3"
              />
            </button>
          </template>

          <template #rankRelativeToMe-header>
            <button class="flex items-center gap-1" @click="toggleSort('rankRelativeToMe')">
              Rank Relative to Me
              <UIcon
                :name="sortKey === 'rankRelativeToMe' && sortDir === 'desc' ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                :class="sortKey === 'rankRelativeToMe' ? 'text-primary' : 'text-muted'"
                class="size-3"
              />
            </button>
          </template>

          <template #retirementDate-header>
            <button class="flex items-center gap-1" @click="toggleSort('retirementDate')">
              Est. Retire Date
              <UIcon
                :name="sortKey === 'retirementDate' && sortDir === 'desc' ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                :class="sortKey === 'retirementDate' ? 'text-primary' : 'text-muted'"
                class="size-3"
              />
            </button>
          </template>

          <!-- Empty state for no results -->
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-12 text-center">
              <UIcon name="i-lucide-calendar-check" class="size-10 text-muted" />
              <div class="space-y-1">
                <p class="font-medium">No retirements found</p>
                <p class="text-sm text-muted">
                  No pilots match the current filters within the {{ yearsHorizon }}-year horizon.
                  Try expanding the time range or adjusting your filters.
                </p>
              </div>
            </div>
          </template>
        </UTable>
        </div>
      </UCard>
    </template>
  </div>
</template>
