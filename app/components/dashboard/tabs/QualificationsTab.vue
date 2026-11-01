<script setup lang="ts">
import type { QualificationSeatGroup } from '~/composables/seniority'

// Current › Holdability: the Qualification directory grouped by seat, highest Seniority Percentile first, then the Qualification scale.
defineProps<{
  loading: boolean
  userFound: boolean
  groups: QualificationSeatGroup[]
  /** Why no Rank exists (e.g. "Anchor Pilot retired"); replaces the directory when set. */
  noResultLabel: string | null
}>()
</script>

<template>
  <div class="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl">
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-6 w-48" />
      <USkeleton class="h-64" />
    </div>

    <template v-else>
    <UEmpty
      v-if="!userFound"
      icon="i-lucide-layout-list"
      title="No Qualifications yet"
      description="Enter your employee number to see where you stand in every Qualification."
      :actions="[{ label: 'Open Settings', icon: 'i-lucide-settings', to: '/settings', size: 'lg' as const }]"
      class="py-10"
    />

    <div v-else class="max-w-3xl">
      <h2 class="font-serif text-xl font-semibold text-highlighted">Qualification directory</h2>
      <p class="mt-1 font-serif text-sm italic text-muted">
        Highest Seniority Percentile first. Your own Qualification is marked.
      </p>

      <p v-if="noResultLabel" data-testid="no-result" class="mt-4 font-mono font-semibold text-highlighted">{{ noResultLabel }}</p>

      <template v-else>
      <section v-for="group in groups" :key="group.seat" class="mt-6" :aria-label="group.seatLabel">
        <h3 class="border-b-2 border-highlighted pb-1 font-serif text-base font-semibold text-highlighted">{{ group.seatLabel }}</h3>
        <table class="w-full border-collapse font-mono text-sm sm:text-base">
          <thead>
            <tr class="border-b border-default font-sans text-xs font-medium text-muted">
              <th scope="col" class="px-2 py-1.5 text-left">Qualification</th>
              <th scope="col" class="px-2 py-1.5 text-right">Rank</th>
              <th scope="col" class="px-2 py-1.5 text-right">Roster Size</th>
              <th scope="col" class="px-2 py-1.5 text-right">Seniority Percentile</th>
            </tr>
          </thead>
          <tbody
            v-for="row in group.rows"
            :key="row.baseFleetLabel"
            :class="row.isAnchorCurrentQualification
              ? 'bg-mark text-mark-ink font-bold shadow-[inset_4px_0_0_var(--mark-ink)]'
              : '[&:nth-of-type(even)]:bg-accented'"
          >
            <tr>
              <td class="px-2 pt-2 font-sans" :class="row.hypotheticalLabel ? 'pb-0.5' : 'pb-2'">{{ row.baseFleetLabel }}</td>
              <td class="px-2 pt-2 text-right" :class="row.hypotheticalLabel ? 'pb-0.5' : 'pb-2'">{{ row.rankLabel }}</td>
              <td class="px-2 pt-2 text-right" :class="[row.hypotheticalLabel ? 'pb-0.5' : 'pb-2', row.isAnchorCurrentQualification ? '' : 'text-muted']">{{ row.rosterOfLabel }}</td>
              <td class="px-2 pt-2 text-right" :class="row.hypotheticalLabel ? 'pb-0.5' : 'pb-2'">{{ row.percentileLabel }}</td>
            </tr>
            <tr v-if="row.hypotheticalLabel">
              <td colspan="4" class="px-2 pb-2" data-testid="hypothetical-row">
                <UBadge color="neutral" variant="outline" size="sm">{{ row.hypotheticalLabel }}</UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      </template>
    </div>

    <DashboardQualificationPositions v-if="userFound && !noResultLabel" />
    </template>
  </div>
</template>
