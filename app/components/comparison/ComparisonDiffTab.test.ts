import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import ComparisonDiffTab from './ComparisonDiffTab.vue'
import type { DiffRow } from '~/utils/build-diff-rows'

type RetiredRow = Extract<DiffRow, { kind: 'retired' }>
type DepartedRow = Extract<DiffRow, { kind: 'departed' }>
type QualMoveRow = Extract<DiffRow, { kind: 'qualMove' }>
type SeniorityNumberChangeRow = Extract<DiffRow, { kind: 'seniorityNumberChange' }>

function makeRetiredRow(overrides: Partial<RetiredRow> = {}): DiffRow {
  return { kind: 'retired', seniority_number: 412, employee_number: '10001', name: 'H. Johansson', seat: 'CA', fleet: '737', base: 'JFK', hire_date: '2000-01-01', retire_date: '2025-01-01', ...overrides }
}

function makeDepartedRow(overrides: Partial<DepartedRow> = {}): DiffRow {
  return { kind: 'departed', seniority_number: 300, employee_number: '10002', name: 'K. Foster', seat: 'FO', fleet: '737', base: 'ORD', hire_date: '2015-01-01', retire_date: '2035-01-01', ...overrides }
}

function makeQualMoveRow(overrides: Partial<QualMoveRow> = {}): DiffRow {
  return { kind: 'qualMove', seniority_number: 150, employee_number: '10003', name: 'R. Chen', old_seat: 'FO', new_seat: 'CA', old_fleet: '737', new_fleet: '777', old_base: 'JFK', new_base: 'ORD', hire_date: '2010-01-01', retire_date: '2040-01-01', ...overrides }
}

function makeSeniorityNumberChangeRow(overrides: Partial<SeniorityNumberChangeRow> = {}): DiffRow {
  return { kind: 'seniorityNumberChange', seniority_number: 488, employee_number: '10005', name: 'M. Torres', old_seniority_number: 500, delta: 12, seat: 'CA', fleet: '777', base: 'DFW', hire_date: '2005-01-01', retire_date: '2045-01-01', ...overrides }
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

  it.each([{ delta: 12, label: '+12' }, { delta: -12, label: '-12' }])('labels assigned-number delta $label without movement arrows', async ({ delta, label }) => {
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows: [makeSeniorityNumberChangeRow({ delta })] },
    })
    await wrapper.find('[data-testid="seniority-number-change-toggle"]').trigger('click')
    expect(wrapper.text()).toContain(`Seniority Number ${label}`)
    expect(wrapper.text()).toContain('Show Seniority Number changes')
    expect(wrapper.text()).toContain('Delta = older Seniority Number − newer Seniority Number.')
    expect(wrapper.text()).not.toContain('↑')
    expect(wrapper.text()).not.toContain('Rank')
  })

  it('shows source identity and Seniority Numbers in expanded change details', async () => {
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows: [makeSeniorityNumberChangeRow({ employee_number: '000123' })] },
      global: { stubs: { UPopover: { template: '<div><slot /><slot name="content" /></div>' } } },
    })
    await wrapper.find('[data-testid="seniority-number-change-toggle"]').trigger('click')
    expect(wrapper.text()).toContain('Employee #: 000123')
    expect(wrapper.text()).toContain('Seniority Number: 500→488 (delta +12)')
    expect(wrapper.text()).not.toContain('Rank:')
  })

  it('hides Seniority Number change rows by default', async () => {
    const rows: DiffRow[] = [makeSeniorityNumberChangeRow(), makeRetiredRow()]
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows },
    })
    expect(wrapper.find('[data-kind="seniorityNumberChange"]').exists()).toBe(false)
    expect(wrapper.find('[data-kind="retired"]').exists()).toBe(true)
  })

  it('shows Seniority Number change rows after toggling the Seniority Number change switch', async () => {
    const rows: DiffRow[] = [makeSeniorityNumberChangeRow()]
    const wrapper = await mountSuspended(ComparisonDiffTab, {
      props: { rows },
    })
    expect(wrapper.find('[data-kind="seniorityNumberChange"]').exists()).toBe(false)

    const toggle = wrapper.find('[data-testid="seniority-number-change-toggle"]')
    await toggle.trigger('click')

    expect(wrapper.find('[data-kind="seniorityNumberChange"]').exists()).toBe(true)
  })
})
