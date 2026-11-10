import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LandingComparison from './LandingComparison.vue'
import type { DiffRow } from '~/utils/build-diff-rows'

const rows: DiffRow[] = [
  { kind: 'retired', seniority_number: 12, employee_number: '1001', name: 'H. Johansson', seat: 'CA', fleet: '320', base: 'JFK', hire_date: '1990-01-01', retire_date: '2025-02-01' },
  { kind: 'newHire', seniority_number: 900, employee_number: '1002', name: 'A. Park', seat: 'FO', fleet: '220', base: 'BOS', hire_date: '2025-03-01', retire_date: '2060-01-01' },
]

describe('LandingComparison', () => {
  it('shows the title, the demo-list caption and the changes', async () => {
    const wrapper = await mountSuspended(LandingComparison, { props: { rows } })
    const text = wrapper.text()
    expect(text).toContain('What changed since the last list')
    expect(text).toContain('Demo lists: 2025-01-01 vs 2025-04-01')
    expect(text).toContain('H. Johansson')
    expect(text).toContain('JFK CA 320')
    expect(text).toContain('New Hire')
  })

  it('keeps the explanation behind an info button', async () => {
    const wrapper = await mountSuspended(LandingComparison, { props: { rows } })
    expect(wrapper.find('button[aria-label="About this comparison"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Compares two published')
  })
})
