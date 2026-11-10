import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import { UApp } from '#components'
import LandingShowcase from './LandingShowcase.vue'
import LandingRetirementWave from './LandingRetirementWave.vue'

async function until(cond: () => boolean) {
  for (let i = 0; i < 300 && !cond(); i++) await new Promise(r => setTimeout(r, 10))
}

describe('LandingRetirementWave', () => {
  it('counts the retirements senior to the sample pilot over the next 5 years', async () => {
    const harness = { setup: () => () => h(UApp, null, () => h(LandingShowcase, null, { default: () => h(LandingRetirementWave) })) }
    const wrapper = await mountSuspended(harness, { global: { stubs: { AnalyticsRetirementWaveChart: true } } })
    await until(() => wrapper.text().includes('Retirements within'))
    const text = wrapper.text()

    expect(text).toContain('Retirement Wave')
    expect(text).toMatch(/\d+ retirements? senior to you in the next 5 years/)
    expect(text).toContain('Sample pilot from the demo list')
  })
})
