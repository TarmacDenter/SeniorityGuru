<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'
import type { ListExcerptRow } from '~/composables/seniority'

// The Seniority List around the Anchor Pilot's line, with the pilot's own line marked.
defineProps<{ rows: ListExcerptRow[] }>()

const isCompact = useMediaQuery('(max-width: 639px)')
const numeric = { class: { th: 'text-right', td: 'text-right' } }
const excerptColumns: TableColumn<ListExcerptRow>[] = [
  { accessorKey: 'seniorityNumber', header: 'Seniority Number', meta: numeric },
  {
    accessorKey: 'nameLabel',
    header: 'Name',
    meta: { class: { td: '[overflow-wrap:anywhere]' } },
    cell: ({ row }) => row.original.status === 'retired'
      ? h('span', null, [row.original.nameLabel, ' ', h(resolveComponent('UBadge'), { color: 'neutral', variant: 'outline', size: 'sm', class: 'no-underline bg-transparent' }, () => 'retired')])
      : row.original.nameLabel,
  },
  { accessorKey: 'rankLabel', header: 'Rank today', meta: numeric },
  { accessorKey: 'publicationPositionLabel', header: 'Publication Position', meta: numeric },
]
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">Your line on the Seniority List</h2>
    </template>
    <SeniorityAnchoredTable
      v-if="rows.length > 0"
      :data="rows"
      :columns="excerptColumns"
      mark-column="nameLabel"
      :column-visibility="{ publicationPositionLabel: !isCompact }"
      caption="Seniority List around your line"
      :ui="{ caption: 'sr-only', td: 'px-3 py-1.5 font-mono text-sm whitespace-normal', th: 'px-3 py-1.5 text-xs font-medium text-muted' }"
    />
  </UCard>
</template>
