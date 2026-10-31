import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SeniorityComparison from './SeniorityComparison.vue'

const chartStub = {
  props: ['data'],
  template: '<div data-testid="series">{{ data.datasets.map(dataset => dataset.label).join("|") }}</div>',
}

function mountComparison(extra: Record<string, unknown>) {
  return mountSuspended(SeniorityComparison, {
    props: {
      qualificationScopeOptions: [{ label: 'Company-wide', scope: {} }],
      computeComparative: () => ({ labels: ['2026-06-15'], baselineData: [50], comparisonData: [40], noResultLabel: null, ...extra }),
    },
    global: { stubs: { DashboardChart: chartStub } },
  })
}

describe('SeniorityComparison', () => {
  it('suffixes a series with (hypothetical) when its scope excludes the Anchor Pilot', async () => {
    const wrapper = await mountComparison({ baselineHypotheticalLabel: 'Hypothetical Placement in BOS' })

    expect(wrapper.get('[data-testid="series"]').text()).toBe('Company-wide (hypothetical)')
  })

  it('leaves the series name alone for a member scope', async () => {
    const wrapper = await mountComparison({ baselineHypotheticalLabel: null })

    expect(wrapper.get('[data-testid="series"]').text()).toBe('Company-wide')
  })
})
