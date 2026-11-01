<script setup lang="ts">
interface SnapshotRow {
  yearLabel: string
  rankLabel: string
  percentileLabel: string
  changeLabel: string
}

defineProps<{
  snapshot: {
    retireDateLabel: string
    projectedRankLabel: string
    percentileLabel: string
    pilotsAheadLabel: string
    rosterSizeLabel: string
    activePilotLabel: string
    hypotheticalLabel: string | null
    rows: SnapshotRow[]
  }
  maxYears: number
}>()

const years = defineModel<number>('years', { required: true })
</script>

<template>
  <section aria-labelledby="retirement-snapshot-heading">
    <h3 id="retirement-snapshot-heading" class="font-serif text-lg font-semibold text-highlighted">Retirement Snapshot</h3>

    <p
      v-if="snapshot.hypotheticalLabel"
      data-testid="snapshot-hypothetical"
      class="mt-2 inline-block -rotate-1 border-2 border-stamp px-2 py-0.5 font-sans text-sm font-semibold text-stamp"
    >
      {{ snapshot.hypotheticalLabel }}
    </p>

    <dl class="mt-3 grid grid-cols-2 gap-x-6 sm:grid-cols-3">
      <div class="flex items-baseline gap-2 border-b border-dotted border-default py-1.5">
        <dt class="text-sm text-muted">Retire Date</dt>
        <dd class="ml-auto whitespace-nowrap font-mono font-semibold text-highlighted">{{ snapshot.retireDateLabel }}</dd>
      </div>
      <div class="flex items-baseline gap-2 border-b border-dotted border-default py-1.5">
        <dt class="text-sm text-muted">Projected Rank</dt>
        <dd class="ml-auto font-mono font-semibold text-highlighted">{{ snapshot.projectedRankLabel }}</dd>
      </div>
      <div class="flex items-baseline gap-2 border-b border-dotted border-default py-1.5">
        <dt class="text-sm text-muted">Seniority Percentile</dt>
        <dd class="ml-auto font-mono font-semibold text-highlighted">{{ snapshot.percentileLabel }}</dd>
      </div>
      <div class="flex items-baseline gap-2 border-b border-dotted border-default py-1.5">
        <dt class="text-sm text-muted">Pilots Ahead</dt>
        <dd class="ml-auto font-mono font-semibold text-highlighted">{{ snapshot.pilotsAheadLabel }}</dd>
      </div>
      <div class="flex items-baseline gap-2 border-b border-dotted border-default py-1.5">
        <dt class="text-sm text-muted">Roster Size today</dt>
        <dd class="ml-auto font-mono font-semibold text-highlighted">{{ snapshot.rosterSizeLabel }}</dd>
      </div>
      <div class="flex items-baseline gap-2 border-b border-dotted border-default py-1.5">
        <dt class="text-sm text-muted">Active pilots</dt>
        <dd class="ml-auto font-mono font-semibold text-highlighted">{{ snapshot.activePilotLabel }}</dd>
      </div>
    </dl>

    <div class="mt-4 flex items-center gap-3">
      <label for="snapshot-years" class="whitespace-nowrap text-sm text-muted">Final years</label>
      <USlider id="snapshot-years" v-model="years" :min="3" :max="maxYears" :step="1" size="sm" class="flex-1" />
      <span class="w-6 text-right font-mono text-sm font-semibold text-highlighted">{{ years }}</span>
    </div>

    <table class="mt-2 w-full border-collapse font-mono text-sm sm:text-base">
      <thead>
        <tr class="border-b border-highlighted font-sans text-xs font-medium text-muted">
          <th scope="col" class="px-2 py-1.5 text-left">Year</th>
          <th scope="col" class="px-2 py-1.5 text-right">Rank</th>
          <th scope="col" class="px-2 py-1.5 text-right">Seniority Percentile</th>
          <th scope="col" class="px-2 py-1.5 text-right">Change</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in snapshot.rows" :key="row.yearLabel" class="even:bg-accented">
          <td class="px-2 py-2 text-left">{{ row.yearLabel }}</td>
          <td class="px-2 py-2 text-right">{{ row.rankLabel }}</td>
          <td class="px-2 py-2 text-right">{{ row.percentileLabel }}</td>
          <td class="px-2 py-2 text-right">{{ row.changeLabel }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
