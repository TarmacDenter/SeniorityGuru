<template>
  <div class="space-y-4">
    <!-- Slider -->
    <div class="flex items-center gap-4">
      <span class="text-sm text-[var(--ui-text-muted)] shrink-0">Now</span>
      <URange
        :model-value="projectionYears"
        :min="0"
        :max="10"
        :step="1"
        class="flex-1"
        @update:model-value="$emit('yearsChange', $event)"
      />
      <span class="text-sm text-[var(--ui-text-muted)] shrink-0">+10 yrs</span>
      <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0 font-mono">
        +{{ projectionYears }}yr{{ projectionYears === 1 ? '' : 's' }}
      </UBadge>
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
      <!-- Build grid: rows = fleet+seat combos, columns = unique bases -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th class="py-2 pr-3 text-left text-xs font-medium text-[var(--ui-text-muted)]">
                Qual
              </th>
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
              <td class="py-2 pr-3 font-medium">{{ qual }}</td>
              <td
                v-for="base in uniqueBases"
                :key="base"
                class="px-2 py-2 text-center"
              >
                <template v-if="cellMap.get(`${qual}|${base}`)">
                  <UBadge
                    :color="badgeColor(cellMap.get(`${qual}|${base}`)!.state)"
                    variant="subtle"
                    size="sm"
                    class="cursor-pointer"
                    :title="cellTooltip(cellMap.get(`${qual}|${base}`)!)"
                    @click="$emit('cellClick', { fleet: cellMap.get(`${qual}|${base}`)!.fleet, seat: cellMap.get(`${qual}|${base}`)!.seat, base })"
                  >
                    <UIcon :name="badgeIcon(cellMap.get(`${qual}|${base}`)!.state)" class="size-3 mr-1" />
                    {{ cellMap.get(`${qual}|${base}`)!.state === 'green' ? 'Hold' : cellMap.get(`${qual}|${base}`)!.remainingNeeded }}
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
          <UBadge color="success" variant="subtle" size="xs">Hold</UBadge>
          You can hold this qual
        </div>
        <div class="flex items-center gap-1">
          <UBadge color="warning" variant="subtle" size="xs">N</UBadge>
          Within 10% — almost holdable
        </div>
        <div class="flex items-center gap-1">
          <UBadge color="error" variant="subtle" size="xs">N</UBadge>
          N pilots ahead of you
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-[var(--ui-text-muted)]">
      No qual data available. Upload a seniority list with fleet, seat, and base fields.
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  cells: {
    fleet: string
    seat: string
    base: string
    state: 'green' | 'amber' | 'red'
    retiredCount: number
    totalInCell: number
    remainingNeeded: number
  }[]
  projectionYears: number
  hasEmployeeNumber: boolean
}>()

defineEmits<{
  cellClick: [{ fleet: string; seat: string; base: string }]
  yearsChange: [number]
}>()

const uniqueQuals = computed(() => {
  const seen = new Set<string>()
  for (const c of props.cells) {
    seen.add(`${c.fleet} ${c.seat}`)
  }
  return Array.from(seen).sort()
})

const uniqueBases = computed(() => {
  const seen = new Set<string>()
  for (const c of props.cells) {
    seen.add(c.base)
  }
  return Array.from(seen).sort()
})

const cellMap = computed(() => {
  const map = new Map<string, typeof props.cells[number]>()
  for (const c of props.cells) {
    map.set(`${c.fleet} ${c.seat}|${c.base}`, c)
  }
  return map
})

function badgeColor(state: 'green' | 'amber' | 'red'): 'success' | 'warning' | 'error' {
  if (state === 'green') return 'success'
  if (state === 'amber') return 'warning'
  return 'error'
}

function badgeIcon(state: 'green' | 'amber' | 'red'): string {
  if (state === 'green') return 'i-lucide-check-circle'
  if (state === 'amber') return 'i-lucide-clock'
  return 'i-lucide-x-circle'
}

function cellTooltip(cell: typeof props.cells[number]): string {
  if (cell.state === 'green') return `You can hold this qual (${cell.retiredCount} retired)`
  if (cell.state === 'amber') return `${cell.remainingNeeded} pilot(s) still ahead — almost there`
  return `${cell.remainingNeeded} pilot(s) still senior to you`
}
</script>
