<template>
  <ClientOnly>
    <div ref="container" class="space-y-6">
      <!-- Qual toggle -->
      <div class="flex justify-center">
        <div class="flex rounded-lg border border-(--ui-border) overflow-hidden text-sm font-medium">
          <button
            v-for="q in qualPresets"
            :key="q.key"
            class="px-4 py-1.5 transition-colors"
            :class="selectedQual === q.key
              ? 'bg-primary text-white'
              : 'text-muted hover:bg-(--ui-bg-elevated)'"
            @click="selectedQual = q.key"
          >
            {{ q.label }}
          </button>
        </div>
      </div>

      <!-- Custom legend -->
      <div class="flex flex-wrap gap-4 justify-center">
        <div
          v-for="item in legendItems"
          :key="item.label"
          class="flex items-center gap-2"
        >
          <div
            class="h-0.5 w-6 rounded-full shrink-0"
            :style="{
              backgroundColor: item.dashed ? 'transparent' : item.color,
              borderTop: item.dashed ? `2px dashed ${item.color}` : undefined,
            }"
          />
          <span class="text-xs text-muted font-medium">{{ item.label }}</span>
        </div>
      </div>

      <!-- Chart area -->
      <div v-if="visible" class="relative h-72 sm:h-80">
        <DashboardChart
          type="line"
          :data="chartData"
          :options="chartOptions"
          height="auto"
        />
      </div>

      <!-- Slider -->
      <div class="flex flex-col items-center gap-2">
        <label class="text-sm text-muted">
          Annual new-hire growth rate:
          <span class="font-mono font-semibold text-primary ml-1">{{ growthRate.toFixed(1) }}%</span>
        </label>
        <input
          v-model.number="growthRate"
          type="range"
          min="0"
          max="10"
          step="0.5"
          class="w-full max-w-sm accent-primary cursor-pointer"
        />
        <div class="flex justify-between w-full max-w-sm text-xs text-muted">
          <span>0% (no growth)</span>
          <span>10% (rapid expansion)</span>
        </div>
      </div>
    </div>

    <template #fallback>
      <div class="space-y-6">
        <USkeleton class="h-8 w-64 mx-auto rounded" />
        <USkeleton class="h-5 w-48 mx-auto rounded" />
        <USkeleton class="h-72 sm:h-80 w-full rounded-lg" />
        <USkeleton class="h-8 w-64 mx-auto rounded" />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'

// ── Qual presets ──────────────────────────────────────────────────────────────

type QualKey = 'fo_narrow' | 'fo_wide' | 'ca_narrow'

const qualPresets: { key: QualKey; label: string; startPct: number; yearsToRetirement: number; thresholdLabel: string }[] = [
  { key: 'fo_narrow', label: 'FO · Narrow', startPct: 22, yearsToRetirement: 37, thresholdLabel: 'CA eligibility' },
  { key: 'fo_wide',   label: 'FO · Wide',   startPct: 50, yearsToRetirement: 22, thresholdLabel: 'Widebody CA' },
  { key: 'ca_narrow', label: 'CA · Narrow', startPct: 73, yearsToRetirement: 15, thresholdLabel: 'Widebody CA' },
]

const selectedQual = ref<QualKey>('fo_narrow')

const activePreset = computed(() => qualPresets.find((q) => q.key === selectedQual.value)!)

// ── Actuarial model ───────────────────────────────────────────────────────────

function generateTrajectory(retirementRate: number, newHireRate: number, startPct: number, years: number): number[] {
  let listSize = 5000
  let rank = Math.round(listSize * (1 - startPct / 100)) + 1
  const result: number[] = []

  result.push(((listSize - rank + 1) / listSize) * 100)

  for (let year = 0; year < years; year++) {
    const retirements = Math.round(listSize * retirementRate / 100)
    const newHires = Math.round(listSize * newHireRate / 100)
    // Retirements happen from the senior end — junior pilots see nearly all of them
    const fracAbove = Math.min(1, (rank - 1) / (listSize * 0.15))
    const retirementsAbove = Math.min(rank - 1, Math.round(retirements * fracAbove))
    rank -= retirementsAbove
    listSize = listSize - retirements + newHires
    rank = Math.min(rank, listSize)
    const pct = ((listSize - rank + 1) / listSize) * 100
    result.push(Math.min(100, Math.max(0, pct)))
  }

  return result
}

// ── Reactive state ────────────────────────────────────────────────────────────

const growthRate = ref(3)
const visible = ref(false)
const container = useTemplateRef<HTMLDivElement>('container')

// Scroll-triggered animation via IntersectionObserver
onMounted(() => {
  const el = container.value
  if (!el) {
    visible.value = true
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting) {
        visible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.2 }
  )
  observer.observe(el)
  onUnmounted(() => observer.disconnect())
})

// ── Chart data ────────────────────────────────────────────────────────────────

const years = computed(() => {
  const n = activePreset.value.yearsToRetirement + 1
  return Array.from({ length: n }, (_, i) => String(2026 + i))
})

const chartData = computed<ChartData>(() => {
  const { startPct, yearsToRetirement, thresholdLabel } = activePreset.value
  const base = generateTrajectory(3.5, growthRate.value, startPct, yearsToRetirement)
  const optimistic = generateTrajectory(4.5, growthRate.value, startPct, yearsToRetirement)
  const pessimistic = generateTrajectory(2.5, growthRate.value, startPct, yearsToRetirement)
  const n = yearsToRetirement + 1

  return {
    labels: years.value,
    datasets: [
      {
        label: 'Base scenario',
        data: base,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Optimistic (+10% retirements)',
        data: optimistic,
        borderColor: '#34d399',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Pessimistic (−10% retirements)',
        data: pessimistic,
        borderColor: '#fb7185',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: false,
      },
      // Threshold reference lines — hidden from legend via filter
      {
        label: `50pct-threshold`,
        data: Array(n).fill(50),
        borderColor: 'rgba(100, 116, 139, 0.45)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
        fill: false,
      },
      {
        label: `75pct-threshold|${thresholdLabel}`,
        data: Array(n).fill(75),
        borderColor: 'rgba(100, 116, 139, 0.45)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
        fill: false,
      },
      {
        label: '90pct-threshold',
        data: Array(n).fill(90),
        borderColor: 'rgba(100, 116, 139, 0.45)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
        fill: false,
      },
    ],
  }
})

// ── Chart options ─────────────────────────────────────────────────────────────

const chartOptions = computed<ChartOptions>(() => ({
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false, // We render a custom legend
    },
    tooltip: {
      filter: (item) => !item.dataset.label?.includes('pct'),
      callbacks: {
        label: (ctx: TooltipItem<'line'>) => ` ${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(1)}%`,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 8,
        callback: (_value, index) => years.value[index] ?? '',
      },
    },
    y: {
      min: 0,
      max: 100,
      title: {
        display: true,
        text: 'Seniority Percentile',
        color: '#64748b',
        font: { family: "'DM Sans Variable', system-ui, sans-serif", size: 11 },
      },
      ticks: {
        callback: (v) => `${v}%`,
      },
    },
  },
}))

// ── Custom legend items ───────────────────────────────────────────────────────

const legendItems = [
  { label: 'Base scenario', color: '#38bdf8', dashed: false },
  { label: 'Optimistic (+10% retirements)', color: '#34d399', dashed: true },
  { label: 'Pessimistic (−10% retirements)', color: '#fb7185', dashed: true },
]
</script>
