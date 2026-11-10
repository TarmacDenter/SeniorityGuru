<script setup lang="ts">
import type { DiffRow } from '~/utils/build-diff-rows'

defineProps<{ rows: DiffRow[] }>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-1.5">
        <h2 class="text-base font-semibold text-highlighted">List comparison</h2>
        <UPopover>
          <UButton icon="i-lucide-info" color="neutral" variant="ghost" size="xs" aria-label="About this comparison" />
          <template #content>
            <p class="max-w-xs p-3 text-sm text-default">
              Compares two published Seniority Lists: pilots who retired or departed, new hires, and Qualification moves.
              Import two lists of your own to see the same view for your airline.
            </p>
          </template>
        </UPopover>
      </div>
      <p class="mt-1 text-xs text-muted">Demo lists: 2025-01-01 vs 2025-04-01</p>
    </template>
    <ComparisonDiffTab :rows="rows" :page-size="8" />
  </UCard>
</template>
