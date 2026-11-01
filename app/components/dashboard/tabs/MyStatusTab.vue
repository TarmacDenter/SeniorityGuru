<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'
import type { ListExcerptRow, RankCardData, StandingFigure } from '~/composables/seniority'

// The Now panel: the Seniority List around the Anchor Pilot's line, then the Standing figures.
defineProps<{
  loading: boolean
  hasData: boolean
  hasEmployeeNumber: boolean
  userFound: boolean
  isNewHireMode: boolean
  rankCard: RankCardData
  figures: StandingFigure[]
  excerptRows: ListExcerptRow[]
}>()

const isCompact = useMediaQuery('(max-width: 639px)')
const numeric = { class: { th: 'text-right', td: 'text-right' } }
const excerptColumns: TableColumn<ListExcerptRow>[] = [
  { accessorKey: 'seniorityNumber', header: 'Seniority Number', meta: numeric },
  {
    accessorKey: 'nameLabel',
    header: 'Name',
    meta: { class: { td: '[overflow-wrap:anywhere]' } },
    cell: ({ row }) => row.original.status === 'retired'
      ? h('span', null, [row.original.nameLabel, ' ', h(resolveComponent('UBadge'), { color: 'neutral', variant: 'outline', size: 'sm', class: 'no-underline' }, () => 'retired')])
      : row.original.nameLabel,
  },
  { accessorKey: 'rankLabel', header: 'Rank', meta: numeric },
  { accessorKey: 'publicationPositionLabel', header: 'Publication Position', meta: numeric },
]
</script>

<template>
  <div class="px-4 sm:px-6 py-4 sm:py-6 max-w-3xl">
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-6 w-48" />
      <USkeleton class="h-64" />
      <USkeleton class="h-32" />
    </div>

    <UEmpty
      v-else-if="!hasData"
      icon="i-lucide-list-ordered"
      title="No Seniority Data Yet"
      description="Upload your airline's seniority list to see your position, track retirements, and project your trajectory."
      :actions="[{ label: 'Upload Seniority List', icon: 'i-lucide-upload', to: '/seniority/upload', size: 'lg' as const }]"
      class="py-24"
    />

    <template v-else>
      <DashboardEmployeeNumberBanner v-if="!hasEmployeeNumber" class="mb-4" />
      <DashboardNewHireModeBanner v-if="!userFound || isNewHireMode" class="mb-4" />

      <template v-if="userFound">
        <h2 class="font-serif text-xl font-semibold text-highlighted">Your line on the Seniority List</h2>
        <p class="mt-1 font-serif text-sm italic text-muted">
          Seniority Number {{ rankCard.seniorityNumber }} · {{ rankCard.base }} {{ rankCard.seat }} {{ rankCard.fleet }}
        </p>

        <p v-if="rankCard.noResultLabel" data-testid="no-result" class="mt-4 font-mono font-semibold text-highlighted">
          {{ rankCard.noResultLabel }}
        </p>

        <SeniorityAnchoredTable
          v-if="excerptRows.length > 0"
          :data="excerptRows"
          :columns="excerptColumns"
          mark-column="nameLabel"
          :column-visibility="{ publicationPositionLabel: !isCompact }"
          caption="Seniority List around your line"
          :ui="{ td: 'px-2 py-2 font-mono text-sm sm:text-base whitespace-normal', th: 'px-2 py-1.5 text-xs font-medium text-muted' }"
          class="mt-4"
        />

        <dl class="mt-6" data-testid="standing-figures">
          <div v-for="figure in figures" :key="figure.label" class="flex items-baseline gap-2 py-1">
            <dt class="font-serif text-base text-default">{{ figure.label }}</dt>
            <span class="flex-1 -translate-y-1 border-b-2 border-dotted border-default" aria-hidden="true" />
            <dd class="font-mono font-medium text-highlighted">{{ figure.value }}</dd>
          </div>
        </dl>

        <DashboardNowDetail />

        <p v-if="rankCard.percentileScaleLabel" class="mt-3 font-serif text-sm italic text-muted">
          {{ rankCard.percentileScaleLabel }}. A Seniority Percentile of 100 is the most senior end.
        </p>
        <UBadge
          v-if="rankCard.hypotheticalLabel"
          data-testid="hypothetical-placement"
          color="neutral"
          variant="outline"
          class="mt-3"
        >
          {{ rankCard.hypotheticalLabel }}
        </UBadge>
      </template>
    </template>
  </div>
</template>
