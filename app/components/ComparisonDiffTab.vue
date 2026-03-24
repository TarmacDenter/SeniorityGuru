<script setup lang="ts">
import type { DiffRow } from '~/utils/build-diff-rows'

const props = defineProps<{
  rows: DiffRow[]
  userEmployeeNumber?: string
}>()

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200]

const showRankChanges = ref(false)
const page = ref(1)
const pageSize = ref(50)

const filteredRows = computed(() =>
  props.rows.filter(r => showRankChanges.value || r.kind !== 'rankChange'),
)

const paginatedRows = computed(() =>
  filteredRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)

const isEmpty = computed(() => filteredRows.value.length === 0)

watch(showRankChanges, () => { page.value = 1 })
watch(pageSize, () => { page.value = 1 })

function rowBgClass(row: DiffRow): string {
  if (row.kind === 'retired') return 'bg-error/10'
  if (row.kind === 'departed') return 'bg-warning/10'
  if (props.userEmployeeNumber && row.employee_number === props.userEmployeeNumber) return 'bg-primary/5'
  return ''
}

function badgeColor(kind: DiffRow['kind']): 'error' | 'warning' | 'info' | 'primary' | 'success' {
  switch (kind) {
    case 'retired': return 'error'
    case 'departed': return 'warning'
    case 'qualMove': return 'info'
    case 'rankChange': return 'primary'
    case 'newHire': return 'success'
  }
}

function qualMoveBadgeLabel(row: Extract<DiffRow, { kind: 'qualMove' }>): string {
  const parts: string[] = []
  if (row.old_seat !== row.new_seat) parts.push(`${row.old_seat}→${row.new_seat}`)
  if (row.old_fleet !== row.new_fleet) parts.push(`${row.old_fleet}→${row.new_fleet}`)
  if (row.old_base !== row.new_base) parts.push(`${row.old_base}→${row.new_base}`)
  return parts.join(' / ') || 'Qual Move'
}

function badgeLabel(row: DiffRow): string {
  switch (row.kind) {
    case 'retired': return 'Retired'
    case 'departed': return 'Departed'
    case 'qualMove': return qualMoveBadgeLabel(row)
    case 'rankChange': return `↑${row.delta}`
    case 'newHire': return 'New Hire'
  }
}

function currentQual(row: DiffRow): string {
  switch (row.kind) {
    case 'qualMove': return `${row.new_seat} / ${row.new_fleet} / ${row.new_base}`
    case 'rankChange': return `${row.seat} / ${row.fleet} / ${row.base}`
    case 'retired':
    case 'departed':
    case 'newHire': return `${row.seat} / ${row.fleet} / ${row.base}`
  }
}
</script>

<template>
  <div>
    <!-- Filter bar -->
    <div class="flex items-center gap-3 mb-3 pb-3 border-b border-(--ui-border)">
      <button
        data-testid="rank-change-toggle"
        type="button"
        class="flex items-center gap-2 text-sm text-(--ui-text-muted) hover:text-(--ui-text) transition-colors cursor-pointer select-none"
        @click="showRankChanges = !showRankChanges"
      >
        <span
          class="inline-flex items-center justify-center w-8 h-4 rounded-full transition-colors"
          :class="showRankChanges ? 'bg-primary' : 'bg-(--ui-border)'"
        >
          <span
            class="w-3 h-3 rounded-full bg-white shadow transition-transform"
            :class="showRankChanges ? 'translate-x-2' : '-translate-x-2'"
          />
        </span>
        Show rank changes
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="isEmpty" class="flex justify-center items-center py-16 text-(--ui-text-muted)">
      No changes between these lists
    </div>

    <!-- Diff list -->
    <div v-else class="border border-(--ui-border) rounded-lg overflow-hidden text-sm">
      <!-- Header -->
      <div class="grid grid-cols-[3rem_1fr_auto_auto] bg-(--ui-bg-elevated) font-medium text-(--ui-text-muted) text-xs uppercase tracking-wide">
        <div class="px-3 py-2 text-right">#</div>
        <div class="px-3 py-2">Name</div>
        <div class="px-3 py-2 hidden sm:block">Qual</div>
        <div class="px-3 py-2 text-right">Change</div>
      </div>

      <!-- Rows -->
      <div class="divide-y divide-(--ui-border)">
        <div
          v-for="row in paginatedRows"
          :key="`${row.kind}-${row.employee_number}`"
          :data-kind="row.kind"
          class="grid grid-cols-[3rem_1fr_auto_auto] items-center transition-colors"
          :class="rowBgClass(row)"
        >
          <!-- Seniority number -->
          <div class="px-3 py-2.5 text-right font-mono text-xs text-(--ui-text-muted)">
            {{ row.seniority_number }}
          </div>

          <!-- Name -->
          <div
            class="px-3 py-2.5 font-medium"
            :class="row.kind === 'retired' || row.kind === 'departed' ? 'line-through text-(--ui-text-muted)' : ''"
          >
            {{ row.name ?? row.employee_number }}
          </div>

          <!-- Current qual -->
          <div class="px-3 py-2.5 hidden sm:block text-xs text-(--ui-text-muted) font-mono">
            {{ currentQual(row) }}
          </div>

          <!-- Badge with popover -->
          <div class="px-3 py-2.5 flex justify-end">
            <UPopover>
              <UBadge
                :color="badgeColor(row.kind)"
                variant="subtle"
                size="xs"
                class="cursor-pointer"
              >
                {{ badgeLabel(row) }}
              </UBadge>

              <template #content>
                <div class="p-3 text-xs space-y-1.5 min-w-48">
                  <div class="font-semibold text-(--ui-text) mb-2">
                    {{ row.name ?? row.employee_number }}
                  </div>

                  <!-- Retired pilot card -->
                  <template v-if="row.kind === 'retired'">
                    <div class="text-(--ui-text-muted)">Seniority: <span class="text-(--ui-text)">{{ row.seniority_number }}</span></div>
                    <div class="text-(--ui-text-muted)">Seat: <span class="text-(--ui-text)">{{ row.seat }}</span></div>
                    <div class="text-(--ui-text-muted)">Fleet: <span class="text-(--ui-text)">{{ row.fleet }}</span></div>
                    <div class="text-(--ui-text-muted)">Base: <span class="text-(--ui-text)">{{ row.base }}</span></div>
                    <div class="text-(--ui-text-muted)">Hired: <span class="text-(--ui-text)">{{ row.hire_date }}</span></div>
                    <div class="text-(--ui-text-muted)">Retired: <span class="text-(--ui-text)">{{ row.retire_date }}</span></div>
                  </template>

                  <!-- Departed pilot card -->
                  <template v-else-if="row.kind === 'departed'">
                    <div class="text-(--ui-text-muted)">Seniority: <span class="text-(--ui-text)">{{ row.seniority_number }}</span></div>
                    <div class="text-(--ui-text-muted)">Seat: <span class="text-(--ui-text)">{{ row.seat }}</span></div>
                    <div class="text-(--ui-text-muted)">Fleet: <span class="text-(--ui-text)">{{ row.fleet }}</span></div>
                    <div class="text-(--ui-text-muted)">Base: <span class="text-(--ui-text)">{{ row.base }}</span></div>
                    <div class="text-(--ui-text-muted)">Hired: <span class="text-(--ui-text)">{{ row.hire_date }}</span></div>
                    <div v-if="row.retire_date" class="text-(--ui-text-muted)">Retire date: <span class="text-(--ui-text)">{{ row.retire_date }}</span></div>
                  </template>

                  <!-- Qual move card -->
                  <template v-else-if="row.kind === 'qualMove'">
                    <div class="text-(--ui-text-muted)">Seniority: <span class="text-(--ui-text)">{{ row.seniority_number }}</span></div>
                    <div class="text-(--ui-text-muted)">Seat:
                      <span v-if="row.old_seat !== row.new_seat" class="text-info font-semibold">{{ row.old_seat }}→{{ row.new_seat }}</span>
                      <span v-else class="text-(--ui-text)">{{ row.new_seat }}</span>
                    </div>
                    <div class="text-(--ui-text-muted)">Fleet:
                      <span v-if="row.old_fleet !== row.new_fleet" class="text-info font-semibold">{{ row.old_fleet }}→{{ row.new_fleet }}</span>
                      <span v-else class="text-(--ui-text)">{{ row.new_fleet }}</span>
                    </div>
                    <div class="text-(--ui-text-muted)">Base:
                      <span v-if="row.old_base !== row.new_base" class="text-info font-semibold">{{ row.old_base }}→{{ row.new_base }}</span>
                      <span v-else class="text-(--ui-text)">{{ row.new_base }}</span>
                    </div>
                    <div class="text-(--ui-text-muted)">Hired: <span class="text-(--ui-text)">{{ row.hire_date }}</span></div>
                    <div class="text-(--ui-text-muted)">Retire date: <span class="text-(--ui-text)">{{ row.retire_date }}</span></div>
                  </template>

                  <!-- Rank change card -->
                  <template v-else-if="row.kind === 'rankChange'">
                    <div class="text-(--ui-text-muted)">Rank: <span class="text-primary font-semibold">{{ row.old_rank }}→{{ row.seniority_number }} (↑{{ row.delta }})</span></div>
                    <div class="text-(--ui-text-muted)">Seat: <span class="text-(--ui-text)">{{ row.seat }}</span></div>
                    <div class="text-(--ui-text-muted)">Fleet: <span class="text-(--ui-text)">{{ row.fleet }}</span></div>
                    <div class="text-(--ui-text-muted)">Base: <span class="text-(--ui-text)">{{ row.base }}</span></div>
                    <div class="text-(--ui-text-muted)">Hired: <span class="text-(--ui-text)">{{ row.hire_date }}</span></div>
                    <div class="text-(--ui-text-muted)">Retire date: <span class="text-(--ui-text)">{{ row.retire_date }}</span></div>
                  </template>

                  <!-- New hire card -->
                  <template v-else-if="row.kind === 'newHire'">
                    <div class="text-(--ui-text-muted)">Seniority: <span class="text-(--ui-text)">{{ row.seniority_number }}</span></div>
                    <div class="text-(--ui-text-muted)">Seat: <span class="text-(--ui-text)">{{ row.seat }}</span></div>
                    <div class="text-(--ui-text-muted)">Fleet: <span class="text-(--ui-text)">{{ row.fleet }}</span></div>
                    <div class="text-(--ui-text-muted)">Base: <span class="text-(--ui-text)">{{ row.base }}</span></div>
                    <div class="text-(--ui-text-muted)">Hired: <span class="text-(--ui-text) text-success font-semibold">{{ row.hire_date }}</span></div>
                    <div class="text-(--ui-text-muted)">Retire date: <span class="text-(--ui-text)">{{ row.retire_date }}</span></div>
                  </template>
                </div>
              </template>
            </UPopover>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredRows.length > 0" class="flex items-center justify-between mt-3 text-sm text-(--ui-text-muted)">
      <div class="flex items-center gap-2">
        <span>Rows per page</span>
        <USelect
          v-model="pageSize"
          :items="PAGE_SIZE_OPTIONS"
          size="xs"
          color="neutral"
          variant="subtle"
          class="w-16"
        />
      </div>
      <UPagination
        v-if="filteredRows.length > pageSize"
        v-model:page="page"
        :total="filteredRows.length"
        :items-per-page="pageSize"
        size="sm"
        color="neutral"
        variant="subtle"
        :sibling-count="1"
      />
    </div>
  </div>
</template>
