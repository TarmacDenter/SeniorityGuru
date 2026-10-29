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
      '94 active pilots',
      '68 active pilots',
      '198 active pilots',
      '142 active pilots',
    ])
    expect(wrapper.text()).toContain('Heights scale independently for each Qualification')
    expect(wrapper.findAll('[data-testid="qualification-scale-projected-position"]')).toHaveLength(4)
  })

  it('shows "Get Started" hero CTA linking to /dashboard', async () => {
    const IndexPage = await import('./index.vue')
    const wrapper = await mountSuspended(IndexPage.default)
    expect(wrapper.text()).toContain('Dig')
    expect(wrapper.html()).toContain('href="/dashboard"')
  })
})
