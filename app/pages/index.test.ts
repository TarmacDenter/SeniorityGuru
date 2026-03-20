import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockUser } = vi.hoisted(() => {
  const { ref: vueRef } = require('vue')
  return { mockUser: vueRef(null) }
})

mockNuxtImport('useSupabaseUser', () => () => mockUser)

// ---------------------------------------------------------------------------
// Stub heavy child components so index.vue can mount without real data
// ---------------------------------------------------------------------------
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

describe('index.vue — CTA conditional rendering', () => {
  beforeEach(() => {
    mockUser.value = null
  })

  it('shows "Request Access" hero CTA when user is not signed in', async () => {
    const IndexPage = await import('./index.vue')
    const wrapper = await mountSuspended(IndexPage.default)
    expect(wrapper.text()).toContain('Request Access')
  })

  it('shows "Go to Dashboard" hero CTA when user is signed in', async () => {
    mockUser.value = { sub: 'user-123' }
    const IndexPage = await import('./index.vue')
    const wrapper = await mountSuspended(IndexPage.default)
    expect(wrapper.text()).toContain('Go to Dashboard')
  })

  it('hero CTA links to /dashboard when user is signed in', async () => {
    mockUser.value = { sub: 'user-123' }
    const IndexPage = await import('./index.vue')
    const wrapper = await mountSuspended(IndexPage.default)
    expect(wrapper.html()).toContain('href="/dashboard"')
  })

  it('hero CTA links to /auth/login when user is not signed in', async () => {
    const IndexPage = await import('./index.vue')
    const wrapper = await mountSuspended(IndexPage.default)
    expect(wrapper.html()).toContain('href="/auth/login"')
  })
})
