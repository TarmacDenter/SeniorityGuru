import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _useConfirm } from './_useConfirm'
import { makeDomainEntry } from '~/test-utils/factories'

const mockStore = vi.hoisted(() => ({
  addList: vi.fn(),
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => mockStore,
}))

describe('_useConfirm', () => {
  beforeEach(() => {
    mockStore.addList.mockReset()
    mockStore.addList.mockResolvedValue(99)
  })

  function createConfirm() {
    const error = ref<string | null>(null)
    return _useConfirm({ error })
  }

  it('starts with null effectiveDate, empty title, not saving', () => {
    const confirm = createConfirm()
    expect(confirm.effectiveDate.value).toBeNull()
    expect(confirm.title.value).toBe('')
    expect(confirm.saving.value).toBe(false)
  })

  it('calls store.addList with mapped entries and returns count', async () => {
    const confirm = createConfirm()
    confirm.effectiveDate.value = { toString: () => '2025-01-01' } as never
    confirm.title.value = 'Jan 2025'

    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E001', seat: 'CA', base: 'LAX', fleet: 'B737', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'E002', seat: 'FO', base: 'LAX', fleet: 'B737', hire_date: '2012-01-01', retire_date: '2042-01-01' }),
    ]

    const count = await confirm.save(entries)

    expect(mockStore.addList).toHaveBeenCalledWith(
      { title: 'Jan 2025', effectiveDate: '2025-01-01' },
      expect.arrayContaining([
        expect.objectContaining({ employeeNumber: 'E001', seniorityNumber: 1 }),
        expect.objectContaining({ employeeNumber: 'E002', seniorityNumber: 2 }),
      ]),
    )
    expect(count).toBe(2)
  })

  it('uses null for title when title is blank', async () => {
    const confirm = createConfirm()
    confirm.effectiveDate.value = { toString: () => '2025-01-01' } as never
    confirm.title.value = ''

    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E001', seat: 'CA', base: 'LAX', fleet: 'B737', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
    ]

    await confirm.save(entries)

    expect(mockStore.addList).toHaveBeenCalledWith(
      expect.objectContaining({ title: null }),
      expect.any(Array),
    )
  })

  it('sets error on save failure and re-throws', async () => {
    mockStore.addList.mockRejectedValue(new Error('DB full'))
    const error = ref<string | null>(null)
    const confirm = _useConfirm({ error })
    confirm.effectiveDate.value = { toString: () => '2025-01-01' } as never

    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E001', seat: 'CA', base: 'LAX', fleet: 'B737', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
    ]

    await expect(confirm.save(entries)).rejects.toThrow('DB full')
    expect(error.value).toBe('DB full')
  })
})
