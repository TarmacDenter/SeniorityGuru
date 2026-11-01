<script setup lang="ts">
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

        <table v-if="excerptRows.length > 0" class="mt-4 w-full border-collapse font-mono text-sm sm:text-base" aria-label="Seniority List around your line">
          <thead>
            <tr class="border-b border-highlighted font-sans text-xs font-medium text-muted">
              <th scope="col" class="px-2 py-1.5 text-right">Seniority Number</th>
              <th scope="col" class="px-2 py-1.5 text-left">Name</th>
              <th scope="col" class="px-2 py-1.5 text-right">Rank</th>
              <th scope="col" class="hidden px-2 py-1.5 text-right sm:table-cell">Publication Position</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in excerptRows"
              :key="row.employeeNumber"
              :aria-current="row.isAnchor ? 'true' : undefined"
              :class="[
                row.isAnchor ? 'bg-mark text-mark-ink font-bold shadow-[inset_4px_0_0_var(--mark-ink)]' : 'even:bg-accented',
                row.status === 'retired' && !row.isAnchor ? 'text-muted line-through' : '',
              ]"
            >
              <td class="px-2 py-2 text-right">{{ row.seniorityNumber }}</td>
              <td class="px-2 py-2 [overflow-wrap:anywhere]">
                {{ row.nameLabel }}
                <span v-if="row.status === 'retired'" class="font-serif text-xs italic text-stamp">retired</span>
              </td>
              <td class="px-2 py-2 text-right">{{ row.rankLabel }}</td>
              <td class="hidden px-2 py-2 text-right sm:table-cell">{{ row.publicationPositionLabel }}</td>
            </tr>
          </tbody>
        </table>

        <dl class="mt-6" data-testid="standing-figures">
          <div v-for="figure in figures" :key="figure.label" class="flex items-baseline gap-2 py-1">
            <dt class="font-serif text-base text-default">{{ figure.label }}</dt>
            <span class="flex-1 -translate-y-1 border-b-2 border-dotted border-default" aria-hidden="true" />
            <dd class="font-mono font-medium text-highlighted">{{ figure.value }}</dd>
          </div>
        </dl>

        <p v-if="rankCard.percentileScaleLabel" class="mt-3 font-serif text-sm italic text-muted">
          {{ rankCard.percentileScaleLabel }}. A Seniority Percentile of 100 is the most senior end.
        </p>
        <p
          v-if="rankCard.hypotheticalLabel"
          data-testid="hypothetical-placement"
          class="mt-3 inline-block -rotate-1 border-2 border-stamp px-2 py-0.5 font-sans text-sm font-semibold text-stamp"
        >
          {{ rankCard.hypotheticalLabel }}
        </p>
      </template>
    </template>
  </div>
</template>
