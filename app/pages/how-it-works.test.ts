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

describe('how-it-works.vue page', () => {
  it('titles the page once, as its main heading', async () => {
    const Page = await import('./how-it-works.vue')
    const wrapper = await mountSuspended(Page.default)
    const headings = wrapper.findAll('h1')
    expect(headings.map(h => h.text())).toEqual(['How It Works'])
    expect(wrapper.text()).toContain('Methodology, assumptions, and data limitations')
  })

  it('lists each required column of a Generic upload with what it holds', async () => {
    const Page = await import('./how-it-works.vue')
    const wrapper = await mountSuspended(Page.default)
    const table = wrapper.find('table')
    expect(table.findAll('th').map(th => th.text())).toEqual(['Column', 'Description'])
    const rows = table.findAll('tbody tr').map(tr => tr.findAll('td').map(td => td.text()))
    expect(rows.map(row => row[0])).toEqual([
      'Seniority Number', 'Employee Number', 'Seat', 'Base', 'Fleet', 'Hire Date', 'Retire Date',
    ])
    expect(rows[2]![1]).toBe('CA (Captain) or FO (First Officer)')
  })
})
