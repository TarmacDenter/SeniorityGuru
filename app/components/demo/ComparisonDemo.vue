<template>
  <div class="space-y-4">
    <!-- Summary stats bar -->
    <div class="flex flex-wrap items-center gap-2 justify-between">
      <div class="flex flex-wrap gap-2">
        <UBadge color="error" variant="subtle" icon="i-lucide-plane-landing">
          2 Retirements
        </UBadge>
        <UBadge color="warning" variant="subtle" icon="i-lucide-log-out">
          1 Departure
        </UBadge>
        <UBadge color="info" variant="subtle" icon="i-lucide-arrow-up-right">
          1 Qual Upgrade
        </UBadge>
        <UBadge color="success" variant="subtle" icon="i-lucide-user-plus">
          2 New Hires
        </UBadge>
      </div>
      <UBadge color="primary" variant="subtle" icon="i-lucide-trending-up">
        Your rank: ↑3 positions
      </UBadge>
    </div>

    <!-- Table -->
    <div class="border border-(--ui-border) rounded-lg overflow-hidden text-sm">
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
          v-for="row in demoRows"
          :key="row.rank"
          class="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_4rem_5rem_5rem_auto] divide-x divide-(--ui-border) items-center transition-colors"
          :class="rowClass(row)"
        >
          <!-- Rank -->
          <div class="px-3 py-2.5 text-right font-mono text-xs text-muted">
            {{ row.rank }}
          </div>

          <!-- Name -->
          <div class="px-3 py-2.5 font-medium" :class="[row.change === 'retired' ? 'line-through text-muted' : '', row.change === 'user' ? 'font-bold' : '']">
            {{ row.name }}
            <span v-if="row.rankDelta !== null && row.change !== 'user'" class="ml-1.5 text-xs text-muted font-normal font-mono">
              {{ row.rankDelta > 0 ? `+${row.rankDelta}` : row.rankDelta }}
            </span>
          </div>

          <!-- Base (hidden mobile) -->
          <div class="px-3 py-2.5 text-muted hidden sm:block font-mono text-xs">
            {{ row.base }}
          </div>

          <!-- Seat (hidden mobile) -->
          <div class="px-3 py-2.5 hidden md:block text-xs">
            <span :class="row.change === 'qual_move' ? 'text-info font-semibold' : 'text-muted'">
              {{ row.seat }}
            </span>
          </div>

          <!-- Fleet (hidden mobile) -->
          <div class="px-3 py-2.5 hidden md:block text-xs font-mono text-muted">
            {{ row.fleet }}
          </div>

          <!-- Change badge -->
          <div class="px-3 py-2.5 flex justify-end">
            <template v-if="row.change === 'retired'">
              <UBadge color="error" variant="subtle" size="xs">Retired</UBadge>
            </template>
            <template v-else-if="row.change === 'departed'">
              <UBadge color="warning" variant="subtle" size="xs">Departed</UBadge>
            </template>
            <template v-else-if="row.change === 'qual_move'">
              <UBadge color="info" variant="subtle" size="xs">{{ row.label }}</UBadge>
            </template>
            <template v-else-if="row.change === 'new_hire'">
              <UBadge color="success" variant="subtle" size="xs">New Hire</UBadge>
            </template>
            <template v-else-if="row.change === 'user'">
              <UBadge color="primary" variant="subtle" size="xs">{{ row.label }}</UBadge>
            </template>
            <template v-else>
              <span class="text-xs font-mono text-muted">
                {{ row.rankDelta !== null ? (row.rankDelta > 0 ? `+${row.rankDelta}` : row.rankDelta) : '—' }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type ChangeType = 'retired' | 'departed' | 'qual_move' | 'new_hire' | 'user' | 'unchanged'

interface DemoRow {
  rank: number
  name: string
  base: string
  seat: string
  fleet: string
  change: ChangeType
  rankDelta: number | null
  label?: string
}

const demoRows: DemoRow[] = [
  { rank: 844, name: 'H. Johansson', base: 'ORD', seat: 'CA', fleet: '777', change: 'retired', rankDelta: null, label: 'Retired' },
  { rank: 845, name: 'M. Williams', base: 'LAX', seat: 'CA', fleet: '767', change: 'retired', rankDelta: null, label: 'Retired' },
  { rank: 846, name: 'T. Anderson', base: 'JFK', seat: 'CA', fleet: '777', change: 'unchanged', rankDelta: -2 },
  { rank: 847, name: 'R. Chen', base: 'DFW', seat: 'FO→CA', fleet: '737', change: 'qual_move', rankDelta: -2, label: 'Upgraded → CA' },
  { rank: 848, name: 'S. Thompson', base: 'MIA', seat: 'FO', fleet: '767', change: 'unchanged', rankDelta: -2 },
  { rank: 849, name: '★ You', base: 'DFW', seat: 'FO', fleet: '737', change: 'user', rankDelta: -3, label: '↑ 3 positions' },
  { rank: 850, name: 'A. Martinez', base: 'SFO', seat: 'FO', fleet: 'A320', change: 'unchanged', rankDelta: -3 },
  { rank: 851, name: 'K. Foster', base: 'BOS', seat: 'FO', fleet: '737', change: 'departed', rankDelta: null, label: 'Departed' },
  { rank: 852, name: 'J. Patel', base: 'SEA', seat: 'FO', fleet: '737', change: 'new_hire', rankDelta: null, label: 'New Hire' },
  { rank: 853, name: 'L. Garcia', base: 'DEN', seat: 'FO', fleet: '737', change: 'new_hire', rankDelta: null, label: 'New Hire' },
]

function rowClass(row: DemoRow): string {
  switch (row.change) {
    case 'retired':
      return 'opacity-50'
    case 'user':
      return 'bg-primary/5'
    default:
      return ''
  }
}
</script>
