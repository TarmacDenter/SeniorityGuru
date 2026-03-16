<template>
  <div class="space-y-4">
    <!-- Now / Future toggle -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <USwitch v-model="useProjection" />
        <span class="text-sm text-[var(--ui-text-muted)]">Project forward</span>
      </div>
      <template v-if="useProjection">
        <USlider
          :model-value="projectionYears"
          :min="1"
          :max="10"
          :step="1"
          class="w-40"
          @update:model-value="$event != null && $emit('yearsChange', $event)"
        />
        <UBadge color="neutral" variant="subtle" size="sm" class="font-mono">
          +{{ projectionYears }}yr{{ projectionYears === 1 ? '' : 's' }}
        </UBadge>
      </template>
      <UBadge v-else color="neutral" variant="subtle" size="sm">As of today</UBadge>
    </div>

    <!-- No employee number state -->
    <UAlert
      v-if="!hasEmployeeNumber"
      icon="i-lucide-user-search"
      color="warning"
      variant="subtle"
      title="Employee Number Required"
      description="Set your employee number in Settings to see your Power Index across all quals."
    />

    <!-- Grid -->
    <div v-else-if="cells.length > 0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th class="py-2 pr-3 text-left text-xs font-medium text-[var(--ui-text-muted)]">Qual</th>
              <th
                v-for="base in uniqueBases"
                :key="base"
                class="px-2 py-2 text-center text-xs font-medium text-[var(--ui-text-muted)]"
              >
                {{ base }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="qual in uniqueQuals"
              :key="qual"
              class="border-t border-[var(--ui-border)]"
            >
              <td class="py-2 pr-3 font-medium whitespace-nowrap">
                <span>{{ qual }}</span>
                <UBadge
                  v-if="qualPercentile(qual) !== null"
                  :color="qualPercentileColor(qualPercentile(qual)!)"
                  variant="subtle"
                  size="xs"
                  class="ml-2 font-mono"
                >
                  P{{ qualPercentile(qual) }}
                </UBadge>
              </td>
              <td
                v-for="base in uniqueBases"
                :key="base"
                class="px-3 py-3 text-center"
              >
                <template v-if="cellMap.get(`${qual}|${base}`)">
                  <UBadge
                    :color="badgeColor(cellMap.get(`${qual}|${base}`)!.state)"
                    :variant="cellMap.get(`${qual}|${base}`)!.isLowestSeniority ? 'outline' : 'subtle'"
                    size="md"
                    class="cursor-pointer min-w-[4.5rem] justify-center font-mono"
                    :title="cellTooltip(cellMap.get(`${qual}|${base}`)!)"
                    @click="$emit('cellClick', { fleet: cellMap.get(`${qual}|${base}`)!.fleet, seat: cellMap.get(`${qual}|${base}`)!.seat, base })"
                  >
                    <UIcon :name="badgeIcon(cellMap.get(`${qual}|${base}`)!)" class="size-4 mr-1" />
                    {{ cellLabel(cellMap.get(`${qual}|${base}`)!) }}
                  </UBadge>
                </template>
                <span v-else class="text-[var(--ui-text-muted)]">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="mt-3 flex flex-wrap gap-3 text-xs text-[var(--ui-text-muted)]">
        <div class="flex items-center gap-1">
          <UBadge color="success" variant="subtle" size="xs">P82</UBadge>
          Can hold — your percentile in base
        </div>
        <div class="flex items-center gap-1">
          <UBadge color="warning" variant="subtle" size="xs">&minus;3</UBadge>
          Close — percentile points to plug
        </div>
        <div class="flex items-center gap-1">
          <UBadge color="error" variant="subtle" size="xs">&minus;15</UBadge>
          Cannot hold — gap to plug percentile
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-[var(--ui-text-muted)]">
      No qual data available. Upload a seniority list with fleet, seat, and base fields.
    </p>
  </div>
</template>

<script setup lang="ts">
import { SEAT_ORDER } from '#shared/utils/qual-analytics'

const props = defineProps<{
  cells: {
    fleet: string
    seat: string
    base: string
    state: 'green' | 'amber' | 'red'
    retiredCount: number
    totalInCell: number
    pilotsAhead: number
    isLowestSeniority: boolean
    cellPercentile: number
    numbersJuniorToPlug: number
    plugPercentile: number
    userPercentile: number
  }[]
  projectionYears: number
  hasEmployeeNumber: boolean
}>()

const emit = defineEmits<{
  cellClick: [{ fleet: string; seat: string; base: string }]
  yearsChange: [number]
}>()

const useProjection = ref(false)

watch(useProjection, (on) => {
  if (!on) emit('yearsChange', 0)
})

const uniqueQuals = computed(() => {
  const seen = new Set<string>()
  for (const c of props.cells) seen.add(`${c.fleet} ${c.seat}`)
  return Array.from(seen).sort((a, b) => {
    const seatA = a.split(' ').pop() ?? ''
    const seatB = b.split(' ').pop() ?? ''
    const orderDiff = (SEAT_ORDER[seatA] ?? 99) - (SEAT_ORDER[seatB] ?? 99)
    if (orderDiff !== 0) return orderDiff
    return a.localeCompare(b)
  })
})

const uniqueBases = computed(() => {
  const seen = new Set<string>()
  for (const c of props.cells) seen.add(c.base)
  return Array.from(seen).sort()
})

const cellMap = computed(() => {
  const map = new Map<string, typeof props.cells[number]>()
  for (const c of props.cells) map.set(`${c.fleet} ${c.seat}|${c.base}`, c)
  return map
})

function badgeColor(state: 'green' | 'amber' | 'red'): 'success' | 'warning' | 'error' {
  if (state === 'green') return 'success'
  if (state === 'amber') return 'warning'
  return 'error'
}

function badgeIcon(cell: typeof props.cells[number]): string {
  if (cell.isLowestSeniority) return 'i-lucide-alert-circle'
  if (cell.state === 'green') return 'i-lucide-check-circle'
  if (cell.state === 'amber') return 'i-lucide-clock'
  return 'i-lucide-x-circle'
}

function qualPercentile(qual: string): number | null {
  const cell = props.cells.find((c) => `${c.fleet} ${c.seat}` === qual)
  if (!cell) return null
  return cell.userPercentile
}

function qualPercentileColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 50) return 'success'
  if (pct >= 25) return 'warning'
  return 'error'
}

function cellLabel(cell: typeof props.cells[number]): string {
  if (cell.isLowestSeniority) return 'Junior'
  if (cell.state === 'green') return `P${cell.cellPercentile}`
  const gap = Math.round(cell.plugPercentile - cell.userPercentile)
  return gap > 0 ? `−${gap}` : `P${cell.cellPercentile}`
}

function cellTooltip(cell: typeof props.cells[number]): string {
  if (cell.isLowestSeniority) return `Most junior — unlikely to hold (${cell.retiredCount} retired)`
  const plugLine = `Plug at P${cell.plugPercentile} · You at P${cell.userPercentile}`
  if (cell.state === 'green') return `Holdable · ${plugLine} · ${cell.retiredCount} of ${cell.totalInCell} retired`
  return `Need P${cell.plugPercentile} to hold · ${plugLine} · +${cell.numbersJuniorToPlug} behind plug`
}
</script>
