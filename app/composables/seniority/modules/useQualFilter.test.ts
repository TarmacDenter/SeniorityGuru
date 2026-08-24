// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useQualificationFilter } from './useQualFilter'
import { useSeniorityCore, _resetCoreSingletons } from './useSeniorityCore'
import { resetMockStores } from '~/test-utils/seniority-mocks'

const mockStore = vi.hoisted(() => {
  const { reactive } = require('vue')
  return reactive({ entries: [] as any[], lists: [] as any[] })
})
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: { preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') } } }))

const { makeEntry } = await import('~/test-utils/factories')

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  useSeniorityCore().newHire.reset()
})

describe('useQualificationFilter', () => {
  it('derives the selected Qualification and cascades available bases', () => {
    mockStore.entries = [
      makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' }),
      makeEntry({ fleet: '737', seat: 'FO', base: 'LAX' }),
      makeEntry({ fleet: '777', seat: 'CA', base: 'ORD' }),
    ]
    const filter = useQualificationFilter()

    filter.selectedFleet.value = '737'
    filter.selectedSeat.value = 'CA'

    expect(filter.availableBases.value).toEqual(['JFK'])
    expect(filter.qualificationScope.value).toEqual({ fleet: '737', seat: 'CA' })
    expect(filter.qualificationLabel.value).toContain('737')
  })

  it('clears a selected value that disappears after the list changes', async () => {
    mockStore.entries = [makeEntry({ fleet: '737', seat: 'CA', base: 'JFK' })]
    const filter = useQualificationFilter()
    filter.selectedFleet.value = '737'

    mockStore.entries = [makeEntry({ fleet: '777', seat: 'CA', base: 'JFK' })]
    await nextTick()

    expect(filter.selectedFleet.value).toBeNull()
  })

  it('clears every filter selection together', () => {
    const filter = useQualificationFilter()
    filter.selectedFleet.value = '737'
    filter.selectedSeat.value = 'CA'
    filter.selectedBase.value = 'JFK'

    filter.clear()

    expect(filter.qualificationScope.value).toEqual({})
  })
})
