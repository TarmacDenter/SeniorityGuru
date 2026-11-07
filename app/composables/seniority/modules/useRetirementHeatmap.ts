import type { PresentedRetirementHeatmap, RetirementHeatmapDimension } from '~/utils/seniority'
import { useScenario } from '~/composables/useScenario'
import { useSeniorityCore } from './useSeniorityCore'

const DIMENSIONS: readonly { value: RetirementHeatmapDimension; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'seat', label: 'Seat' },
  { value: 'fleet', label: 'Fleet' },
]

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

const EMPTY: PresentedRetirementHeatmap = { yearLabels: [], rows: [], isEmpty: true, undatedPilotNote: null }

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

  const dimensions = computed(() => DIMENSIONS.map(dimension => ({ ...dimension, selected: groupBy.value.includes(dimension.value) })))
  function toggleDimension(dimension: RetirementHeatmapDimension) {
    groupBy.value = groupBy.value.includes(dimension)
      ? groupBy.value.filter(value => value !== dimension)
      : [...groupBy.value, dimension]
  }

  const heatmap = computed(() => listAnalysis.value?.retirementHeatmap({
    groupBy: groupBy.value,
    scenario: { qualificationScope: qualificationScope.value },
  }).presentation ?? EMPTY)

  const points = computed<RetirementHeatmapPoint[]>(() => heatmap.value.rows.flatMap(row => row.cells.map(cell => ({
    x: String(cell.year),
    y: row.label,
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
  const rowLabels = computed(() => heatmap.value.rows.map(row => row.label))
  /** What the chart shows, for screen readers. */
  const summaryLabel = computed(() => {
    const groups = `${rowLabels.value.length} ${rowLabels.value.length === 1 ? 'group' : 'groups'}`
    return `Retirement heatmap, ${scopeLabel.value}, ${groupedByLabel.value.toLowerCase()}: ${groups} from ${yearLabels.value[0]} to ${yearLabels.value.at(-1)}. ${valueLegend.value}.`
  })

  return {
    hasData,
    dimensions,
    toggleDimension,
    showPercent,
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
