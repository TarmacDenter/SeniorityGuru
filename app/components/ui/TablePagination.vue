<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  currentPage: number
  pageCount: number
  totalRows: number
  pageSize: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const isMobile = useMediaQuery('(max-width: 639px)')

const gotoPageInput = ref<number | null>(null)

function commitGotoPage() {
  const val = gotoPageInput.value
  if (val == null) return
  const clamped = Math.max(1, Math.min(props.pageCount, val))
  emit('update:page', clamped)
  gotoPageInput.value = null
}

function handleGotoKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') commitGotoPage()
}
</script>

<template>
  <div class="px-3 sm:px-0">
    <!-- Single page: just show results count -->
    <p v-if="pageCount <= 1" class="text-sm text-muted">
      {{ totalRows }} results
    </p>

    <!-- Multi-page mobile: first/prev/next/last + go-to-page input -->
    <div v-else-if="isMobile" class="flex items-center justify-between gap-2">
      <div class="flex gap-1">
        <UButton
          icon="i-lucide-chevrons-left" size="sm" variant="outline" color="neutral"
          aria-label="First page" :disabled="currentPage === 1"
          @click="emit('update:page', 1)"
        />
        <UButton
          icon="i-lucide-chevron-left" size="sm" variant="outline" color="neutral"
          aria-label="Previous page" :disabled="currentPage === 1"
          @click="emit('update:page', currentPage - 1)"
        />
        <UButton
          icon="i-lucide-chevron-right" size="sm" variant="outline" color="neutral"
          aria-label="Next page" :disabled="currentPage === pageCount"
          @click="emit('update:page', currentPage + 1)"
        />
        <UButton
          icon="i-lucide-chevrons-right" size="sm" variant="outline" color="neutral"
          aria-label="Last page" :disabled="currentPage === pageCount"
          @click="emit('update:page', pageCount)"
        />
      </div>

      <div class="flex items-center gap-1.5 text-xs text-muted">
        <span>p.</span>
        <UInput
          type="number"
          :placeholder="String(currentPage)"
          :model-value="gotoPageInput ?? undefined"
          size="xs"
          :min="1"
          :max="pageCount"
          class="w-14"
          :ui="{ base: 'text-center' }"
          @update:model-value="(v: string | number) => gotoPageInput = v ? Number(v) : null"
          @blur="commitGotoPage"
          @keydown="handleGotoKeydown"
        />
        <span>/ {{ pageCount }}</span>
      </div>
    </div>

    <!-- Multi-page desktop: standard page-number pagination -->
    <div v-else class="flex items-center justify-between gap-4">
      <p class="text-sm text-muted shrink-0">
        {{ totalRows }} results &middot; Page {{ currentPage }} of {{ pageCount }}
      </p>
      <UPagination
        :page="currentPage"
        :total="totalRows"
        :items-per-page="pageSize"
        :sibling-count="2"
        size="sm"
        show-edges
        @update:page="(p: number) => emit('update:page', p)"
      />
    </div>
  </div>
</template>
