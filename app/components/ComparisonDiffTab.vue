<script setup lang="ts">
import type { CompareResult } from '~/utils/seniority-compare'

const props = defineProps<{
  comparison: CompareResult
  userEmployeeNumber?: string
}>()

type RowType = 'retired' | 'departed' | 'qualMove' | 'rankChange' | 'newHire'

interface DiffRow {
  key: string
  type: RowType
  employee_number: string
  name: string | undefined
  rank: number | undefined
  base?: string
  seat?: string
  fleet?: string
  badgeLabel: string
}

const rows = computed<DiffRow[]>(() => {
  const result: DiffRow[] = []

  for (const p of props.comparison.retired) {
    result.push({
      key: `retired-${p.employee_number}`,
      type: 'retired',
      employee_number: p.employee_number,
      name: p.name,
      rank: p.seniority_number,
      badgeLabel: 'Retired',
    })
  }

  for (const p of props.comparison.departed) {
    result.push({
      key: `departed-${p.employee_number}`,
      type: 'departed',
      employee_number: p.employee_number,
      name: p.name,
      rank: p.seniority_number,
      badgeLabel: 'Departed',
    })
  }

  for (const p of props.comparison.qualMoves) {
    const seatChanged = p.old_seat !== p.new_seat
    const badgeLabel = seatChanged ? `${p.old_seat}→${p.new_seat}` : 'Qual Move'
    result.push({
      key: `qualMove-${p.employee_number}`,
      type: 'qualMove',
      employee_number: p.employee_number,
      name: p.name,
      rank: p.seniority_number,
      base: p.new_base,
      seat: `${p.old_seat}→${p.new_seat}`,
      fleet: p.new_fleet,
      badgeLabel,
    })
  }

  for (const p of props.comparison.rankChanges) {
    const deltaLabel = p.delta > 0 ? `↑${p.delta}` : `↓${Math.abs(p.delta)}`
    result.push({
      key: `rankChange-${p.employee_number}`,
      type: 'rankChange',
      employee_number: p.employee_number,
      name: p.name,
      rank: p.new_rank,
      badgeLabel: deltaLabel,
    })
  }

  for (const p of props.comparison.newHires) {
    result.push({
      key: `newHire-${p.employee_number}`,
      type: 'newHire',
      employee_number: p.employee_number,
      name: p.name,
      rank: p.seniority_number,
      badgeLabel: 'New Hire',
    })
  }

  return result
})

const isEmpty = computed(() =>
  props.comparison.retired.length === 0 &&
  props.comparison.departed.length === 0 &&
  props.comparison.qualMoves.length === 0 &&
  props.comparison.rankChanges.length === 0 &&
  props.comparison.newHires.length === 0,
)

function rowClass(row: DiffRow): string {
  const classes: string[] = []
  if (row.type === 'retired') classes.push('opacity-50')
  if (props.userEmployeeNumber && row.employee_number === props.userEmployeeNumber) {
    classes.push('bg-primary/5')
  }
  return classes.join(' ')
}

function badgeColor(type: RowType): 'error' | 'warning' | 'info' | 'primary' | 'success' {
  switch (type) {
    case 'retired': return 'error'
    case 'departed': return 'warning'
    case 'qualMove': return 'info'
    case 'rankChange': return 'primary'
    case 'newHire': return 'success'
  }
}
</script>

<template>
  <div>
    <!-- Empty state -->
    <div v-if="isEmpty" class="flex justify-center items-center py-16 text-(--ui-text-muted)">
      No changes between these lists
    </div>

    <!-- Table -->
    <div v-else class="border border-(--ui-border) rounded-lg overflow-hidden text-sm">
      <!-- Header -->
      <div class="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_4rem_5rem_5rem_auto] bg-(--ui-bg-elevated) divide-x divide-(--ui-border) font-medium text-muted text-xs uppercase tracking-wide">
        <div class="px-3 py-2 text-right">#</div>
        <div class="px-3 py-2">Name</div>
        <div class="px-3 py-2 hidden sm:block">Base</div>
        <div class="px-3 py-2 hidden md:block">Seat</div>
        <div class="px-3 py-2 hidden md:block">Fleet</div>
        <div class="px-3 py-2 text-right">Change</div>
      </div>

      <!-- Rows -->
      <div class="divide-y divide-(--ui-border)">
        <div
          v-for="row in rows"
          :key="row.key"
          class="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_4rem_5rem_5rem_auto] divide-x divide-(--ui-border) items-center transition-colors"
          :class="rowClass(row)"
        >
          <!-- Rank -->
          <div class="px-3 py-2.5 text-right font-mono text-xs text-muted">
            {{ row.rank ?? '—' }}
          </div>

          <!-- Name -->
          <div
            class="px-3 py-2.5 font-medium"
            :class="row.type === 'retired' ? 'line-through text-muted' : ''"
          >
            {{ row.name ?? row.employee_number }}
          </div>

          <!-- Base (hidden mobile) -->
          <div class="px-3 py-2.5 text-muted hidden sm:block font-mono text-xs">
            {{ row.base ?? '—' }}
          </div>

          <!-- Seat (hidden mobile) -->
          <div class="px-3 py-2.5 hidden md:block text-xs">
            <span :class="row.type === 'qualMove' ? 'text-info font-semibold' : 'text-muted'">
              {{ row.seat ?? '—' }}
            </span>
          </div>

          <!-- Fleet (hidden mobile) -->
          <div class="px-3 py-2.5 hidden md:block text-xs font-mono text-muted">
            {{ row.fleet ?? '—' }}
          </div>

          <!-- Change badge -->
          <div class="px-3 py-2.5 flex justify-end">
            <UBadge :color="badgeColor(row.type)" variant="subtle" size="xs">
              {{ row.badgeLabel }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
