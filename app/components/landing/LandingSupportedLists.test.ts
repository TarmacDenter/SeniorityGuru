import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LandingSupportedLists from './LandingSupportedLists.vue'

describe('LandingSupportedLists', () => {
  it('names the supported lists and links to format help and plugin requests', async () => {
    const wrapper = await mountSuspended(LandingSupportedLists)
    const text = wrapper.text()
    expect(text).toContain('Delta')
    expect(text).toContain('jetBlue')
    expect(text).toContain('Generic CSV/XLSX')
    expect(text).toContain('Required format')
    expect(text).toContain('Request an Import Plugin')

    const hrefs = wrapper.findAll('a').map(a => a.attributes('href'))
    expect(hrefs).toContain('/how-it-works#data-compatibility')
    expect(hrefs.some(h => h?.includes('github.com/TarmacDenter/SeniorityGuru/issues/new'))).toBe(true)
    expect(hrefs.some(h => h?.startsWith('mailto:') && h.includes('Import%20Plugin%20Request'))).toBe(true)
  })
})
