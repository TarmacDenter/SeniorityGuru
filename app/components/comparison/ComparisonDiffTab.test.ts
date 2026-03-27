import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import ComparisonDiffTab from './ComparisonDiffTab.vue'
import type { DiffRow } from '~/utils/build-diff-rows'

type RetiredRow = Extract<DiffRow, { kind: 'retired' }>
type DepartedRow = Extract<DiffRow, { kind: 'departed' }>
type QualMoveRow = Extract<DiffRow, { kind: 'qualMove' }>
type RankChangeRow = Extract<DiffRow, { kind: 'rankChange' }>

function makeRetiredRow(overrides: Partial<RetiredRow> = {}): DiffRow {
  return { kind: 'retired', seniority_number: 412, employee_number: '10001', name: 'H. Johansson', seat: 'CA', fleet: '737', base: 'JFK', hire_date: '2000-01-01', retire_date: '2025-01-01', ...overrides }
}

function makeDepartedRow(overrides: Partial<DepartedRow> = {}): DiffRow {
  return { kind: 'departed', seniority_number: 300, employee_number: '10002', name: 'K. Foster', seat: 'FO', fleet: '737', base: 'ORD', hire_date: '2015-01-01', retire_date: '2035-01-01', ...overrides }
}

function makeQualMoveRow(overrides: Partial<QualMoveRow> = {}): DiffRow {
  return { kind: 'qualMove', seniority_number: 150, employee_number: '10003', name: 'R. Chen', old_seat: 'FO', new_seat: 'CA', old_fleet: '737', new_fleet: '777', old_base: 'JFK', new_base: 'ORD', hire_date: '2010-01-01', retire_date: '2040-01-01', ...overrides }
}

function makeRankChangeRow(overrides: Partial<RankChangeRow> = {}): DiffRow {
  return { kind: 'rankChange', seniority_number: 488, employee_number: '10005', name: 'M. Torres', old_rank: 500, delta: 12, seat: 'CA', fleet: '777', base: 'DFW', hire_date: '2005-01-01', retire_date: '2045-01-01', ...overrides }
}

describe('ComparisonDiffTab', () => {
  it('shows empty state message when rows is empty', async () => {
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows: [] },
    })
    expect(wrapper.text()).toContain('No changes between these lists')
  })

  it('applies red tint class to retired rows', async () => {
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows: [makeRetiredRow()] },
    })
    const row = wrapper.find('[data-kind="retired"]')
    expect(row.exists()).toBe(true)
    expect(row.classes().join(' ')).toContain('bg-error')
  })

  it('applies amber tint class to departed rows', async () => {
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows: [makeDepartedRow()] },
    })
    const row = wrapper.find('[data-kind="departed"]')
    expect(row.exists()).toBe(true)
    expect(row.classes().join(' ')).toContain('bg-warning')
  })

  it('shows qual move badge with all changed fields inline', async () => {
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows: [makeQualMoveRow()] },
    })
    expect(wrapper.text()).toContain('FO→CA')
    expect(wrapper.text()).toContain('737→777')
    expect(wrapper.text()).toContain('JFK→ORD')
  })

  it('shows rank change badge with ↑N format when rank changes are enabled', async () => {
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows: [makeRankChangeRow({ delta: 12 })] },
    })
    await wrapper.find('[data-testid="rank-change-toggle"]').trigger('click')
    expect(wrapper.text()).toContain('↑12')
  })

  it('hides rank change rows by default', async () => {
    const rows: DiffRow[] = [makeRankChangeRow(), makeRetiredRow()]
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows },
    })
    expect(wrapper.find('[data-kind="rankChange"]').exists()).toBe(false)
    expect(wrapper.find('[data-kind="retired"]').exists()).toBe(true)
  })

  it('shows rank change rows after toggling the rank change switch', async () => {
    const rows: DiffRow[] = [makeRankChangeRow()]
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows },
    })
    expect(wrapper.find('[data-kind="rankChange"]').exists()).toBe(false)

    const toggle = wrapper.find('[data-testid="rank-change-toggle"]')
    await toggle.trigger('click')

    expect(wrapper.find('[data-kind="rankChange"]').exists()).toBe(true)
  })
})
