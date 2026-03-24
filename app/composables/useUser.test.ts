import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'

// ── Store mocks ────────────────────────────────────────────────────────────

const mockSavePreference = vi.fn()
const mockLoadPreferences = vi.fn()

const mockUserStore = {
  employeeNumber: null as string | null,
  retirementAge: 65,
  loading: false,
  error: null as string | null,
  savePreference: mockSavePreference,
  loadPreferences: mockLoadPreferences,
}

const mockSeniorityEntries: SeniorityEntry[] = []

vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => ({ entries: mockSeniorityEntries }),
}))

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useUser', () => {
  beforeEach(() => {
    mockUserStore.employeeNumber = null
    mockUserStore.retirementAge = 65
    mockUserStore.loading = false
    mockUserStore.error = null
    mockSeniorityEntries.length = 0
    mockSavePreference.mockReset().mockResolvedValue(undefined)
    mockLoadPreferences.mockReset().mockResolvedValue(undefined)
  })

  describe('state', () => {
    it('employeeNumber mirrors the user store', async () => {
      mockUserStore.employeeNumber = '12345'
      const { useUser } = await import('./useUser')
      const user = useUser()
      expect(user.employeeNumber.value).toBe('12345')
    })

    it('retirementAge mirrors the user store', async () => {
      mockUserStore.retirementAge = 60
      const { useUser } = await import('./useUser')
      const user = useUser()
      expect(user.retirementAge.value).toBe(60)
    })

    it('loading mirrors the user store', async () => {
      mockUserStore.loading = true
      const { useUser } = await import('./useUser')
      const user = useUser()
      expect(user.loading.value).toBe(true)
    })
  })

  describe('entry', () => {
    it('returns undefined when employeeNumber is null', async () => {
      mockUserStore.employeeNumber = null
      const { useUser } = await import('./useUser')
      const user = useUser()
      expect(user.entry.value).toBeUndefined()
    })

    it('returns the matching seniority entry by employee number', async () => {
      mockUserStore.employeeNumber = 'EMP001'
      mockSeniorityEntries.push(
        { employee_number: 'EMP001', seniority_number: 1, seat: 'CA', base: 'JFK', fleet: '737', hire_date: '2010-01-01', retire_date: '2040-01-01' },
        { employee_number: 'EMP002', seniority_number: 2, seat: 'FO', base: 'LAX', fleet: '777', hire_date: '2012-01-01', retire_date: '2045-01-01' },
      )
      const { useUser } = await import('./useUser')
      const user = useUser()
      expect(user.entry.value?.employee_number).toBe('EMP001')
    })

    it('returns undefined when employee number has no match in entries', async () => {
      mockUserStore.employeeNumber = 'EMP001'
      mockSeniorityEntries.push({ employee_number: 'EMP999', seniority_number: 1, seat: 'CA', base: 'JFK', fleet: '737', hire_date: '2010-01-01', retire_date: '2040-01-01' })
      const { useUser } = await import('./useUser')
      const user = useUser()
      expect(user.entry.value).toBeUndefined()
    })
  })

  describe('loadPreferences', () => {
    it('delegates to store.loadPreferences', async () => {
      const { useUser } = await import('./useUser')
      const user = useUser()
      await user.loadPreferences()
      expect(mockLoadPreferences).toHaveBeenCalledOnce()
    })
  })

  describe('savePreference', () => {
    it('delegates to store.savePreference', async () => {
      const { useUser } = await import('./useUser')
      const user = useUser()
      await user.savePreference('employeeNumber', '12345')
      expect(mockSavePreference).toHaveBeenCalledWith('employeeNumber', '12345')
    })

    it('returns { error: null } on success', async () => {
      const { useUser } = await import('./useUser')
      const user = useUser()
      const result = await user.savePreference('employeeNumber', '12345')
      expect(result.error).toBeNull()
    })

    it('returns an error when store.savePreference throws', async () => {
      mockSavePreference.mockRejectedValue(new Error('DB write failed'))
      const { useUser } = await import('./useUser')
      const user = useUser()
      const result = await user.savePreference('employeeNumber', '12345')
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error!.message).toBe('DB write failed')
    })
  })
})
