// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useHoldability } from './useHoldability'
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

// The anchor (3) is in JFK FO 737 and senior to its threshold (4). LAX FO 777's threshold is pilot 2, reached when
// pilot 1 retires in 2028. JFK CA 737's threshold is pilot 1, at the top of the list: not before the anchor retires.
function seed(anchorRetire = '2050-01-01') {
  mockStore.entries = [
    makeEntry({ seniority_number: 1, employee_number: 'E1', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2028-01-01' }),
    makeEntry({ seniority_number: 2, employee_number: 'E2', base: 'LAX', seat: 'FO', fleet: '777', retire_date: '2060-01-01' }),
    makeEntry({ seniority_number: 3, employee_number: 'E3', base: 'JFK', seat: 'FO', fleet: '737', retire_date: anchorRetire }),
    makeEntry({ seniority_number: 4, employee_number: 'E4', base: 'JFK', seat: 'FO', fleet: '737', retire_date: '2060-01-01' }),
  ]
  mockUserStore.employeeNumber = 'E3'
}

function rowsByQualification(holdability: ReturnType<typeof useHoldability>) {
  return Object.fromEntries(holdability.groups.value.flatMap(group => group.rows).map(row => [row.baseFleetLabel + ' ' + row.seat, row]))
}

describe('useHoldability', () => {
  it('labels the Rank column as Today\'s Rank', () => {
    seed()
    expect(useHoldability().columnLabels.rank).toBe('Today\'s Rank')
  })

  it('gives every Qualification row its Holdable Year status', () => {
    seed()
    const rows = rowsByQualification(useHoldability())

    expect(rows['JFK 737 FO']).toMatchObject({ holdableLabel: 'Holdable now', holdableStatus: 'now', thresholdRelationLabel: null })
    expect(rows['LAX 777 FO']).toMatchObject({
      holdableLabel: 'Holdable from 2028',
      holdableStatus: 'later',
      thresholdRelationLabel: 'Junior to the most junior pilot (Seniority Number 2)',
    })
    expect(rows['JFK 737 CA']).toMatchObject({
      holdableLabel: 'Not before your retirement',
      holdableStatus: 'never',
      thresholdRelationLabel: 'Junior to the most junior pilot (Seniority Number 1)',
    })
  })

  it('shows the detail for the selected Qualification and hides it when deselected', async () => {
    seed()
    const holdability = useHoldability()
    expect(holdability.detail.value).toBeNull()

    const lax = rowsByQualification(holdability)['LAX 777 FO']!
    holdability.select(lax.key)
    await nextTick()

    expect(holdability.selectedKey.value).toBe(lax.key)
    expect(holdability.detail.value).toMatchObject({ qualificationLabel: '777 FO LAX', holdableLabel: 'Holdable from 2028' })
    expect(holdability.detail.value!.anchorSeries.length).toBeGreaterThan(1)

    holdability.select(lax.key)
    await nextTick()
    expect(holdability.detail.value).toBeNull()
  })

  it('shows one seat at a time, starting with the Anchor Pilot\'s seat', async () => {
    seed()
    const holdability = useHoldability()
    expect(holdability.seatOptions.value).toEqual([{ label: 'Captain', value: 'CA' }, { label: 'First Officer', value: 'FO' }])
    expect(holdability.selectedSeat.value).toBe('FO')
    expect(holdability.visibleGroups.value.map(group => group.seatLabel)).toEqual(['First Officer'])

    holdability.selectedSeat.value = 'CA'
    await nextTick()
    expect(holdability.visibleGroups.value.map(group => group.seatLabel)).toEqual(['Captain'])
  })

  it('links each Qualification to Junior captains in Demographics', () => {
    seed()
    expect(useHoldability().juniorCaptainsLink).toBe('/dashboard/demographics#junior-captains')
  })

  it('says why there are no rows when the Anchor Pilot has retired', () => {
    seed('2020-01-01')
    const holdability = useHoldability()
    expect(holdability.groups.value).toEqual([])
    expect(holdability.noResultLabel.value).toBe('Anchor Pilot retired')
  })
})
