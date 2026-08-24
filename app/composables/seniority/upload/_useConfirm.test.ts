import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _useConfirm } from './_useConfirm'
import { createUploadSession } from './test-utils'
import { makeDomainEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'

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
    return _useConfirm(createUploadSession({ error }))
  }

  it('starts with null effectiveDate, empty title, not saving', () => {
    const confirm = createConfirm()
    expect(confirm.effectiveDate.value).toBeNull()
    expect(confirm.title.value).toBe('')
    expect(confirm.saving.value).toBe(false)
  })

  it('calls store.addList with mapped entries and returns count', async () => {
    const confirm = createConfirm()
    confirm.effectiveDate.value = parsePlainDate('2025-01-01')
    confirm.title.value = 'Jan 2025'

    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E001', seat: 'CA', base: 'LAX', fleet: 'B737', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'E002', seat: 'FO', base: 'LAX', fleet: 'B737', hire_date: '2012-01-01', retire_date: '2042-01-01' }),
    ]

    const count = await confirm.save(entries)

    expect(mockStore.addList).toHaveBeenCalledWith(
      { title: 'Jan 2025', effectiveDate: parsePlainDate('2025-01-01') },
      expect.arrayContaining([
        expect.objectContaining({ employee_number: 'E001', seniority_number: 1 }),
        expect.objectContaining({ employee_number: 'E002', seniority_number: 2 }),
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
    const confirm = _useConfirm(createUploadSession({ error }))
    confirm.effectiveDate.value = { toString: () => '2025-01-01' } as never

    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E001', seat: 'CA', base: 'LAX', fleet: 'B737', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
    ]

    await expect(confirm.save(entries)).rejects.toThrow('DB full')
    expect(error.value).toBe('DB full')
  })

  it('propagates store validation errors for duplicate seniority numbers', async () => {
    mockStore.addList.mockRejectedValueOnce(new Error('Duplicate seniority number'))
    const error = ref<string | null>(null)
    const confirm = _useConfirm(createUploadSession({ error }))
    confirm.effectiveDate.value = { toString: () => '2025-01-01' } as never

    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E1' }),
      makeDomainEntry({ seniority_number: 1, employee_number: 'E2' }), // duplicate seniority
    ]

    await expect(confirm.save(entries)).rejects.toThrow()
    expect(error.value).toContain('Duplicate seniority number')
    expect(mockStore.addList).toHaveBeenCalled()
  })

  it('propagates store validation errors for duplicate employee numbers', async () => {
    mockStore.addList.mockRejectedValueOnce(new Error('Duplicate employee number'))
    const error = ref<string | null>(null)
    const confirm = _useConfirm(createUploadSession({ error }))
    confirm.effectiveDate.value = { toString: () => '2025-01-01' } as never

    const entries = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'SAME' }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'SAME' }), // duplicate employee
    ]

    await expect(confirm.save(entries)).rejects.toThrow()
    expect(error.value).toContain('Duplicate employee number')
    expect(mockStore.addList).toHaveBeenCalled()
  })
})
