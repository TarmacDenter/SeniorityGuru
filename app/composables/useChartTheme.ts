import type { ChartOptions } from 'chart.js'

const SANS = "'IBM Plex Sans', system-ui, sans-serif"
const MONO = "'IBM Plex Mono', ui-monospace, monospace"

/** Canvas cannot read CSS variables, so each token is resolved to its current value. */
function readToken(name: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function buildColors() {
  return {
    /** The one ink: bars and lines. */
    ink: readToken('--ui-text-toned'),
    /** Bar fill on the page paper. Single ink, no second hue. */
    inkFill: readToken('--ui-text-dimmed'),
    /** Second series and axis text. */
    soft: readToken('--ui-text-muted'),
    softFill: readToken('--ui-border'),
    /** The pilot's own line: highlighter, with the dark ink that stays readable on it. */
    mark: readToken('--mark'),
    markInk: readToken('--mark-ink'),
    rule: readToken('--ui-border'),
  }
}

function buildDefaults(colors: ReturnType<typeof buildColors>): ChartOptions {
  const ticks = { color: colors.soft, font: { family: MONO, size: 10 } }
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: colors.soft, font: { family: SANS, size: 12 } }
      },
      tooltip: {
        backgroundColor: readToken('--ui-bg-elevated'),
        titleColor: readToken('--ui-text-highlighted'),
        bodyColor: readToken('--ui-text-toned'),
        borderColor: colors.rule,
        borderWidth: 1,
        padding: 10,
        titleFont: { family: SANS, size: 13, weight: 'bold' as const },
        bodyFont: { family: MONO, size: 12 }
      }
    },
    scales: {
      x: { ticks: { ...ticks }, grid: { color: colors.rule } },
      y: { ticks: { ...ticks }, grid: { color: colors.rule } }
    }
  }
}

/**
 * Chart colors drawn from the active mode's semantic tokens.
 * `colors` and `defaults` are reactive: they refresh when the color mode changes,
 * so charts that read them redraw on dark/light.
 */
export function useChartTheme() {
  const colorMode = useColorMode()
  const colors = reactive(buildColors())
  const defaults = reactive(buildDefaults(colors)) as ChartOptions

  function refresh() {
    Object.assign(colors, buildColors())
    Object.assign(defaults, buildDefaults(colors))
  }

  watch(() => colorMode.value, () => {
    refresh()
    // The mode class lands on <html> after this tick; read again once it has.
    nextTick(refresh)
  }, { flush: 'post' })

  return { defaults, colors }
}
