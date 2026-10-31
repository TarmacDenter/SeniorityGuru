import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

vi.mock('~/composables/usePwaInstall', () => ({
  usePwaInstall: () => ({
    install: vi.fn(),
    showBanner: false,
    isIos: false,
    showIosModal: { value: false },
    standalone: false,
    snooze: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

vi.mock('~/components/demo/TrajectoryDemo.vue', () => ({
  default: { template: '<div data-testid="trajectory-demo" />' },
}))

vi.mock('~/components/demo/ComparisonDemo.vue', () => ({
  default: { template: '<div data-testid="comparison-demo" />' },
}))

vi.mock('~/components/analytics/AgeDistributionChart.vue', () => ({
  default: { template: '<div data-testid="age-distribution-chart" />' },
}))

vi.mock('~/components/analytics/RetirementWaveChart.vue', () => ({
  default: { template: '<div data-testid="retirement-wave-chart" />' },
}))

describe('index.vue — CTA rendering', () => {
  it('renders sample Qualification counts and independent scaling disclosure', async () => {
    const IndexPage = await import('./index.vue')
    const wrapper = await mountSuspended(IndexPage.default)

    expect(wrapper.findAll('[data-testid="qualification-scale-active-count"]').map(count => count.text())).toEqual([
      '99 on roster · 94 active',
      '72 on roster · 68 active',
      '208 on roster · 198 active',
      '150 on roster · 142 active',
    ])
    expect(wrapper.text()).toContain('Heights scale independently for each Qualification')
    expect(wrapper.findAll('[data-testid="qualification-scale-projected-position"]')).toHaveLength(4)
  })

  it('uses Seniority Number, Rank, and Seniority Percentile in the sample card', async () => {
    const IndexPage = await import('./index.vue')
    const text = (await mountSuspended(IndexPage.default)).text()
    expect(text).toContain('Seniority Number')
    expect(text).toContain('Seniority Percentile')
    expect(text).toContain('of 4,892 on roster')
    expect(text).not.toContain('0th')
    expect(text).not.toContain('/ 4,892')
    expect(text).not.toContain('Seniority #')
  })

  it('shows "Get Started" hero CTA linking to /dashboard', async () => {
    const IndexPage = await import('./index.vue')
    const wrapper = await mountSuspended(IndexPage.default)
    expect(wrapper.text()).toContain('Dig')
    expect(wrapper.html()).toContain('href="/dashboard"')
  })
})
