import { h } from 'vue'
import type { Column } from '@tanstack/vue-table'
import { UButton } from '#components'

export function sortableHeader<T>(label: string) {
  return ({ column }: { column: Column<T> }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      label,
      icon: isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : isSorted === 'desc'
          ? 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
      variant: 'ghost',
      color: 'neutral',
      class: '-mx-2.5',
      onClick: () => column.toggleSorting(),
    })
  }
}
