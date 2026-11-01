<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'
import { useDashboardList } from '~/composables/useDashboardList'
import type { ListExcerptRow, QualificationSeatGroup, RankCardData, StandingFigure } from '~/composables/seniority'

// Current › Status: the headline figures, the Seniority List around the Anchor Pilot's line,
// and the Status by Base / Seat / Fleet table, all in one pass. Without an Anchor Pilot it only asks for one.
defineProps<{
  loading: boolean
  hasData: boolean
  hasEmployeeNumber: boolean
  userFound: boolean
  isNewHireMode: boolean
  rankCard: RankCardData
  figures: StandingFigure[]
  excerptRows: ListExcerptRow[]
  qualificationGroups: QualificationSeatGroup[]
}>()

const { holdabilityLink } = useDashboardList()

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
  <div class="px-4 sm:px-6 py-4 sm:py-6 max-w-6xl">
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

    <div v-else-if="!userFound" class="max-w-xl space-y-3 py-8">
      <p v-if="hasEmployeeNumber" class="text-sm text-default">Your employee number is not on this list.</p>
      <DashboardEmployeeNumberBanner />
      <p class="text-sm text-muted">
        Not on the list yet?
        <ULink to="/settings" class="text-highlighted underline">Turn on New Hire Mode in Settings</ULink>.
      </p>
    </div>

    <div v-else class="space-y-6">
      <DashboardNewHireModeBanner v-if="isNewHireMode" />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <UCard :ui="{ body: 'p-0 sm:p-0' }" class="lg:order-2">
          <template #header>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base font-semibold text-highlighted">Your standing</h2>
              <UPopover v-if="rankCard.percentileScaleLabel">
                <UButton icon="i-lucide-info" color="neutral" variant="ghost" size="xs" aria-label="About these figures" />
                <template #content>
                  <p class="max-w-xs p-3 text-sm text-default">
                    {{ rankCard.percentileScaleLabel }}. A Seniority Percentile of 100 is the most senior end.
                  </p>
                </template>
              </UPopover>
              <UBadge
                v-if="rankCard.hypotheticalLabel"
                data-testid="hypothetical-placement"
                color="neutral"
                variant="outline"
              >
                {{ rankCard.hypotheticalLabel }}
              </UBadge>
            </div>
            <p class="mt-1 text-sm text-muted">{{ rankCard.base }} {{ rankCard.seat }} {{ rankCard.fleet }}</p>
          </template>

          <p v-if="rankCard.noResultLabel" data-testid="no-result" class="px-4 pt-4 font-mono font-semibold text-highlighted">
            {{ rankCard.noResultLabel }}
          </p>
          <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2" data-testid="standing-figures">
            <div v-for="figure in figures" :key="figure.label" class="px-4 py-3">
              <dt class="text-xs text-muted">{{ figure.label }}</dt>
              <dd class="mt-0.5 font-mono text-xl font-semibold text-highlighted">{{ figure.value }}</dd>
              <dd v-if="figure.note" class="text-xs text-muted">{{ figure.note }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }" class="lg:order-1">
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">Your line on the Seniority List</h2>
          </template>
          <SeniorityAnchoredTable
            v-if="excerptRows.length > 0"
            :data="excerptRows"
            :columns="excerptColumns"
            mark-column="nameLabel"
            :column-visibility="{ publicationPositionLabel: !isCompact }"
            caption="Seniority List around your line"
            :ui="{ caption: 'sr-only', td: 'px-3 py-1.5 font-mono text-sm whitespace-normal', th: 'px-3 py-1.5 text-xs font-medium text-muted' }"
          />
        </UCard>
      </div>

      <DashboardBaseStatusTable :groups="qualificationGroups" :no-result-label="rankCard.noResultLabel" />
      <UButton label="Open Holdability" :to="holdabilityLink" color="neutral" variant="link" size="sm" trailing-icon="i-lucide-arrow-right" class="px-0" />
    </div>
  </div>
</template>
