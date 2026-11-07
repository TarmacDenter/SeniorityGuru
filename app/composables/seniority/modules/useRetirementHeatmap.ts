import type { PresentedRetirementHeatmap, RetirementHeatmapDimension, RetirementHeatmapSort } from '~/utils/seniority'
import { useScenario } from '~/composables/useScenario'
import { useSeniorityCore } from './useSeniorityCore'

const DIMENSIONS: readonly { value: RetirementHeatmapDimension; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'seat', label: 'Seat' },
  { value: 'fleet', label: 'Fleet' },
]

const SORTS: readonly { value: RetirementHeatmapSort; label: string }[] = [
  { value: 'qualification', label: 'Base, Fleet, Seat' },
  { value: 'retirements', label: 'Most retirements' },
  { value: 'percent', label: 'Highest % of group' },
]

const DEFAULT_YEARS = 10

/** One shaded cell of the heatmap: a year (x) of a group (y). */
export interface RetirementHeatmapPoint {
  x: string
  y: string
  /** The value shown: a count, or a percent of the group's active pilots. */
  label: string
  /** 0–1 against the busiest cell in the chosen mode. */
  intensity: number
  description: string
}

const EMPTY: PresentedRetirementHeatmap = { yearLabels: [], availableYearCount: 0, yearRangeLabel: '', rows: [], isEmpty: true, undatedPilotNote: null }

/**
 * Demographics › Retirement heatmap: scheduled retirements of active pilots by group and year.
 * The Scenario's Qualification Scope filters pilots; the chosen dimensions (any of Base, Seat, Fleet) split rows.
 * Reads the published list only, so a New Hire Mode pilot is never counted.
 */
export function useRetirementHeatmap() {
  const { listAnalysis, hasData } = useSeniorityCore()
  const { qualificationScope, scopeLabel } = useScenario()

  const groupBy = useState<RetirementHeatmapDimension[]>('retirementHeatmapGroupBy', () => ['base'])
  const showPercent = useState<boolean>('retirementHeatmapShowPercent', () => false)
  const sortBy = useState<RetirementHeatmapSort>('retirementHeatmapSortBy', () => 'qualification')
  const yearsChoice = useState<number>('retirementHeatmapYears', () => DEFAULT_YEARS)

  const dimensions = computed(() => DIMENSIONS.map(dimension => ({ ...dimension, selected: groupBy.value.includes(dimension.value) })))
  function toggleDimension(dimension: RetirementHeatmapDimension) {
    groupBy.value = groupBy.value.includes(dimension)
      ? groupBy.value.filter(value => value !== dimension)
      : [...groupBy.value, dimension]
  }

  const output = (years?: number) => listAnalysis.value?.retirementHeatmap({
    groupBy: groupBy.value,
    scenario: { qualificationScope: qualificationScope.value },
    sortBy: sortBy.value,
    years,
  }).presentation ?? EMPTY
  /** Years with a scheduled retirement in the scope; the years control stops there. */
  const maxYears = computed(() => Math.max(1, output().availableYearCount))
  const years = computed<number>({
    get: () => Math.min(Math.max(1, yearsChoice.value), maxYears.value),
    set: (value) => { yearsChoice.value = value },
  })
  const heatmap = computed(() => output(years.value))
  const yearsLabelFor = (count: number) => `Next ${count} ${count === 1 ? 'year' : 'years'}`

  const points = computed<RetirementHeatmapPoint[]>(() => heatmap.value.rows.flatMap(row => row.cells.map(cell => ({
    x: String(cell.year),
    y: row.axisLabel,
    label: showPercent.value ? cell.percentLabel : cell.countLabel,
    intensity: showPercent.value ? cell.percentIntensity : cell.countIntensity,
    description: cell.description,
  }))))

  const groupedByLabel = computed(() => {
    const names = DIMENSIONS.filter(dimension => groupBy.value.includes(dimension.value)).map(dimension => dimension.label)
    return names.length ? `By ${names.join(', ').toLowerCase()}` : 'Whole scope'
  })

  const valueLegend = computed(() => showPercent.value ? 'Share of the group\u2019s active pilots retiring that year' : 'Retirements scheduled that year')
  const yearLabels = computed(() => heatmap.value.yearLabels)
  const rowLabels = computed(() => heatmap.value.rows.map(row => row.axisLabel))
  /** What the chart shows, for screen readers. */
  const summaryLabel = computed(() => {
    const groups = `${rowLabels.value.length} ${rowLabels.value.length === 1 ? 'group' : 'groups'}`
    const sort = SORTS.find(item => item.value === sortBy.value)!.label
    return `Retirement heatmap, ${scopeLabel.value}, ${groupedByLabel.value.toLowerCase()}, sorted by ${sort}: ${groups} from ${yearLabels.value[0]} to ${yearLabels.value.at(-1)}. ${valueLegend.value}.`
  })

  return {
    hasData,
    dimensions,
    toggleDimension,
    showPercent,
    sortBy,
    sortItems: SORTS,
    years,
    maxYears,
    yearsLabelFor,
    yearRangeLabel: computed(() => heatmap.value.yearRangeLabel),
    scopeLabel,
    groupedByLabel,
    isEmpty: computed(() => heatmap.value.isEmpty),
    undatedPilotNote: computed(() => heatmap.value.undatedPilotNote),
    yearLabels,
    rowLabels,
    rows: computed(() => heatmap.value.rows),
    points,
    valueLegend,
    summaryLabel,
  }
}
