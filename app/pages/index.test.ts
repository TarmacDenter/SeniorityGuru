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

// The showcase loads the demo lists; its sections are covered by their own tests.
vi.mock('~/components/landing/LandingShowcase.vue', () => ({
  default: { template: '<div data-testid="landing-showcase" />' },
}))

async function mountIndex() {
  const IndexPage = await import('./index.vue')
  return mountSuspended(IndexPage.default)
}

describe('index.vue', () => {
  it('leads with local analysis and says the file is never sent anywhere', async () => {
    const text = (await mountIndex()).text()
    expect(text).toContain('Analyze your company seniority deeply and locally.')
    expect(text).toContain('nothing is sent to a server')
    expect(text).not.toMatch(/upload/i)
    expect(text).not.toMatch(/you'll be|will be on the/)
  })

  it('offers View Demo once, Open Dashboard and Install App', async () => {
    const wrapper = await mountIndex()
    const labels = wrapper.findAll('button, a').map(el => el.text())
    expect(labels.filter(label => label === 'View Demo')).toHaveLength(1)
    expect(labels).toContain('Try the Demo')
    expect(labels).toContain('Install App')
    expect(wrapper.html()).toContain('href="/dashboard"')
  })

  it('renders the showcase of demo-list sections', async () => {
    const wrapper = await mountIndex()
    expect(wrapper.find('[data-testid="landing-showcase"]').exists()).toBe(true)
  })

  it('states privacy and supported lists once', async () => {
    const text = (await mountIndex()).text()
    expect(text.match(/Local data/g)).toHaveLength(1)
    expect(text).toContain('Supported lists')
    expect(text).toContain('Delta')
    expect(text).toContain('jetBlue')
  })

  it('drops the fabricated sample sections', async () => {
    const text = (await mountIndex()).text()
    expect(text).not.toContain('Position by qualification')
    expect(text).not.toContain('Age Distribution')
    expect(text).not.toContain('4,892')
  })
})
