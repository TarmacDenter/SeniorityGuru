import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('how-it-works.vue copy', () => {
  it('defines Rank, Publication Position, Roster Size, and Seniority Percentile', async () => {
    const Page = await import('./how-it-works.vue')
    const text = (await mountSuspended(Page.default)).text()
    expect(text).toContain('Publication Position')
    expect(text).toContain('Roster Size')
    expect(text).toContain('Rank against Roster Size')
    expect(text).toContain('N is the Roster Size')
    expect(text).not.toContain('Raw and Adjusted Rank')
    expect(text).not.toContain('pilots in the selected scope')
    expect(text).not.toContain('Integer rank on the seniority list')
  })

  it('states the Qualification Threshold basis', async () => {
    const Page = await import('./how-it-works.vue')
    const text = (await mountSuspended(Page.default)).text()
    expect(text).toContain("active incumbent's Rank against Roster Size")
  })
})
