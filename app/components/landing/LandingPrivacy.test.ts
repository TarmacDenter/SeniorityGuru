import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LandingPrivacy from './LandingPrivacy.vue'

describe('LandingPrivacy', () => {
  it('states the three privacy facts once', async () => {
    const wrapper = await mountSuspended(LandingPrivacy)
    const text = wrapper.text()
    expect(text).toContain('Use your airline\'s data')
    expect(text).toContain('Local data')
    expect(text).toContain('SeniorityGuru does not receive them.')
    expect(text).toContain('No account')
    expect(wrapper.findAll('li')).toHaveLength(3)
  })
})
