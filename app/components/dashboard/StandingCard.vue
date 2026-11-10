<script setup lang="ts">
import type { RankCardData, StandingFigure } from '~/composables/seniority'

type NoteLink = NonNullable<StandingFigure['noteLink']>

// The headline Standing figures. A figure note that points elsewhere links to `noteLinks[key]`;
// without `noteLinks` it renders as a button that emits `note-click`, for pages with no list to open.
defineProps<{
  rankCard: RankCardData
  figures: StandingFigure[]
  noteLinks?: Partial<Record<NoteLink, string>>
}>()

defineEmits<{ 'note-click': [link: NoteLink] }>()
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
        <dd v-if="figure.note" class="text-xs text-muted">
          <template v-if="figure.noteLink">
            <ULink v-if="noteLinks" :to="noteLinks[figure.noteLink]" class="underline">{{ figure.note }}</ULink>
            <button v-else type="button" class="underline" @click="$emit('note-click', figure.noteLink)">{{ figure.note }}</button>
          </template>
          <template v-else>{{ figure.note }}</template>
        </dd>
      </div>
    </dl>
  </UCard>
</template>
