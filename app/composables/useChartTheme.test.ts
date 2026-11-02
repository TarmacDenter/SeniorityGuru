import { describe, it, expect, afterEach } from 'vitest'
import { nextTick } from 'vue'

const root = () => document.documentElement

function paint(mode: 'light' | 'dark', tokens: Record<string, string>) {
  root().classList.toggle('dark', mode === 'dark')
  for (const [name, value] of Object.entries(tokens)) root().style.setProperty(name, value)
}

describe('useChartTheme', () => {
  afterEach(() => {
    root().removeAttribute('style')
    root().classList.remove('dark')
    useColorMode().preference = 'dark'
  })

  it('draws chart ink and the pilot highlighter from the active mode tokens', async () => {
    paint('light', { '--ui-text-toned': '#3a4753', '--ui-text-muted': '#51606c', '--mark': '#ffe14d' })
    useColorMode().preference = 'light'
    await nextTick()
    const { colors } = useChartTheme()
    expect(colors.ink).toBe('#3a4753')
    expect(colors.soft).toBe('#51606c')
    expect(colors.mark).toBe('#ffe14d')
  })

  it('redraws in night-paper colors when the mode switches to dark', async () => {
    paint('light', { '--ui-text-toned': '#3a4753', '--mark': '#ffe14d' })
    useColorMode().preference = 'light'
    await nextTick()
    const { colors, defaults } = useChartTheme()
    expect(colors.ink).toBe('#3a4753')

    paint('dark', { '--ui-text-toned': '#c4cec6', '--mark': '#dad66e' })
    useColorMode().preference = 'dark'
    await nextTick()
    await nextTick()
    expect(colors.ink).toBe('#c4cec6')
    expect(colors.mark).toBe('#dad66e')
    expect(defaults.scales?.x?.ticks?.color).toBe(colors.soft)
  })

  it('carries no fixed slate or blue colors in the legend, tooltip or grid', () => {
    paint('dark', { '--ui-text-muted': '#9aa9a0', '--ui-bg-elevated': '#1a262b', '--ui-text-highlighted': '#ffffff', '--ui-text': '#e6ebe3', '--ui-border': '#35463b' })
    const { defaults } = useChartTheme()
    const serialized = JSON.stringify(defaults)
    expect(serialized).not.toMatch(/#64748b|#0f172a|#f8fafc|#cbd5e1|#1e293b|51, 65, 85/i)
  })
})
