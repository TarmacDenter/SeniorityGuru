import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import ComparisonDiffTab from './ComparisonDiffTab.vue'
import type { CompareResult } from '~/utils/seniority-compare'

const emptyComparison: CompareResult = {
  retired: [],
  departed: [],
  qualMoves: [],
  rankChanges: [],
  newHires: [],
}

describe('ComparisonDiffTab', () => {
  it('shows retirement entry name in output', async () => {
    const comparison: CompareResult = {
      ...emptyComparison,
      retired: [
        {
          employee_number: '10001',
          name: 'H. Johansson',
          seniority_number: 844,
          retire_date: '2025-01-01',
        },
      ],
    }
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { comparison },
    })
    expect(wrapper.text()).toContain('H. Johansson')
  })

  it('shows departure entry in output', async () => {
    const comparison: CompareResult = {
      ...emptyComparison,
      departed: [
        {
          employee_number: '10002',
          name: 'K. Foster',
          seniority_number: 851,
          retire_date: undefined,
        },
      ],
    }
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { comparison },
    })
    expect(wrapper.text()).toContain('K. Foster')
  })

  it('shows qual move entry in output', async () => {
    const comparison: CompareResult = {
      ...emptyComparison,
      qualMoves: [
        {
          employee_number: '10003',
          name: 'R. Chen',
          seniority_number: 847,
          old_seat: 'FO',
          new_seat: 'CA',
          old_fleet: '737',
          new_fleet: '737',
          old_base: 'DFW',
          new_base: 'DFW',
        },
      ],
    }
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { comparison },
    })
    expect(wrapper.text()).toContain('R. Chen')
  })

  it('shows new hire entry in output', async () => {
    const comparison: CompareResult = {
      ...emptyComparison,
      newHires: [
        {
          employee_number: '10004',
          name: 'J. Patel',
          seniority_number: 852,
          hire_date: '2025-06-01',
        },
      ],
    }
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { comparison },
    })
    expect(wrapper.text()).toContain('J. Patel')
  })

  it('shows empty state message when all arrays are empty', async () => {
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { comparison: emptyComparison },
    })
    expect(wrapper.text()).toContain('No changes between these lists')
  })
})
