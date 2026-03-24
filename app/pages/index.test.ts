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

vi.mock('~/components/analytics/QualSeniorityScale.vue', () => ({
  default: { template: '<div data-testid="qual-seniority-scale" />' },
}))

vi.mock('~/components/analytics/AgeDistributionChart.vue', () => ({
  default: { template: '<div data-testid="age-distribution-chart" />' },
}))

vi.mock('~/components/analytics/RetirementWaveChart.vue', () => ({
  default: { template: '<div data-testid="retirement-wave-chart" />' },
}))

describe('index.vue — CTA rendering', () => {
  it('shows "Get Started" hero CTA linking to /dashboard', async () => {
    const IndexPage = await import('./index.vue')
    const wrapper = await mountSuspended(IndexPage.default)
    expect(wrapper.text()).toContain('Get Started')
    expect(wrapper.html()).toContain('href="/dashboard"')
  })
})
