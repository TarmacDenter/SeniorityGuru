<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useSeniorityCore } from '~/composables/seniority'
import type { UpcomingRetirementRow } from '~/utils/seniority-engine'

const { lens, hasData, entries } = useSeniorityCore()
const { employeeNumber } = useUser()

const hasEmployeeNumber = computed(() => !!employeeNumber.value)

// ── Filter state ────────────────────────────────────────────────────────────
const yearsHorizon = ref<1 | 2 | 3 | 5 | number>(2)
const seniorOnly = ref(true)
const filterBase = ref<string | null>(null)
const filterSeat = ref<string | null>(null)
const filterFleet = ref<string | null>(null)

// ── Sort state ───────────────────────────────────────────────────────────────
type SortKey = 'retireDate' | 'seniorityNumber' | 'rankRelativeToMe'
type SortDir = 'asc' | 'desc'
const sortKey = ref<SortKey>('retireDate')
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

// ── Qual options ─────────────────────────────────────────────────────────────
const availableBases = computed(() =>
  [...new Set(entries.value.map(e => e.base).filter(Boolean))].sort(),
)
const availableSeats = computed(() =>
  [...new Set(entries.value.map(e => e.seat).filter(Boolean))].sort(),
)
const availableFleets = computed(() =>
  [...new Set(entries.value.map(e => e.fleet).filter(Boolean))].sort(),
)

// ── Rows ─────────────────────────────────────────────────────────────────────
const rows = computed((): UpcomingRetirementRow[] => {
  if (!hasData.value || !lens.value) return []

  const raw = lens.value.upcomingRetirements({
    yearsHorizon: yearsHorizon.value,
    seniorOnly: seniorOnly.value && hasEmployeeNumber.value,
    base: filterBase.value || null,
    seat: filterSeat.value || null,
    fleet: filterFleet.value || null,
  })

  return [...raw].sort((a, b) => {
    let cmp = 0
    if (sortKey.value === 'retireDate') cmp = a.retireDate.localeCompare(b.retireDate)
    else if (sortKey.value === 'seniorityNumber') cmp = a.seniorityNumber - b.seniorityNumber
    else if (sortKey.value === 'rankRelativeToMe') cmp = ((a.rankRelativeToMe ?? 0) - (b.rankRelativeToMe ?? 0))
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

const columns = computed((): TableColumn<UpcomingRetirementRow>[] => {
  const base: TableColumn<UpcomingRetirementRow>[] = [
    { accessorKey: 'seniorityNumber', header: 'Seniority #' },
    {
      accessorKey: 'qual',
      header: 'Qual',
      cell: ({ row }) => `${row.original.base} · ${row.original.seat} / ${row.original.fleet}`,
    },
    { accessorKey: 'retireDate', header: 'Est. Retire Date' },
  ]
  if (hasEmployeeNumber.value) {
    base.splice(1, 0, {
      accessorKey: 'rankRelativeToMe',
      header: 'Rank Relative to Me',
      cell: ({ row }) => {
        const v = row.original.rankRelativeToMe
        if (v == null) return '—'
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
  <div class="p-4 sm:p-6 space-y-4">
    <!-- Empty state: no list loaded -->
    <div
      v-if="!hasData"
      class="flex flex-col items-center justify-center py-24 gap-6 text-center"
    >
      <UIcon name="i-lucide-calendar-x" class="size-14 text-muted" />
      <div class="space-y-2">
        <h2 class="text-xl font-semibold">No seniority list loaded</h2>
        <p class="text-muted max-w-sm">
          Import your airline's seniority list to see upcoming retirements.
        </p>
      </div>
      <UButton to="/seniority/upload" icon="i-lucide-upload">
        Import a list
      </UButton>
    </div>

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
          <USwitch v-model="seniorOnly" :disabled="!hasEmployeeNumber" size="sm" />
          <span class="text-sm" :class="!hasEmployeeNumber ? 'text-muted' : ''">
            Senior to me only
          </span>
        </div>

        <!-- Qual filters -->
        <div class="flex items-center gap-2 flex-wrap">
          <USelectMenu
            v-model="filterBase"
            :items="[{ label: 'All bases', value: null }, ...availableBases.map(b => ({ label: b, value: b }))]"
            value-key="value"
            label-key="label"
            placeholder="Base"
            size="sm"
            class="w-28"
          />
          <USelectMenu
            v-model="filterSeat"
            :items="[{ label: 'All seats', value: null }, ...availableSeats.map(s => ({ label: s, value: s }))]"
            value-key="value"
            label-key="label"
            placeholder="Seat"
            size="sm"
            class="w-24"
          />
          <USelectMenu
            v-model="filterFleet"
            :items="[{ label: 'All fleets', value: null }, ...availableFleets.map(f => ({ label: f, value: f }))]"
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
        v-if="!hasEmployeeNumber"
        class="flex items-center gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-4 py-3 text-sm"
      >
        <UIcon name="i-lucide-user-x" class="size-4 shrink-0 text-muted" />
        <span class="text-muted">
          Set your employee number in
          <NuxtLink to="/settings" class="underline text-primary">Settings</NuxtLink>
          to see rank relative to you and filter by seniority.
        </span>
      </div>

      <!-- Table -->
      <UCard :ui="{ body: 'p-0' }">
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

          <template #retireDate-header>
            <button class="flex items-center gap-1" @click="toggleSort('retireDate')">
              Est. Retire Date
              <UIcon
                :name="sortKey === 'retireDate' && sortDir === 'desc' ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                :class="sortKey === 'retireDate' ? 'text-primary' : 'text-muted'"
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
