import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, nextTick } from 'vue'
import { _resetCoreSingletons, useSeniorityCore, provideSeniorityCore, type SeniorityCore } from '~/composables/seniority/modules/useSeniorityCore'
import { useStanding } from '~/composables/seniority/modules/useStanding'
import { useScenario } from '~/composables/useScenario'
import { useLandingShowcase } from '~/composables/useLandingShowcase'
import { resetMockStores } from '~/test-utils/seniority-mocks'

const mockStore = vi.hoisted(() => ({
  entries: [] as any[],
  lists: [] as any[],
  addList: vi.fn(),
  getEntriesForList: vi.fn(),
}))
const mockUserStore = vi.hoisted(() => ({ employeeNumber: null as string | null, retirementAge: 65, getPreference: vi.fn().mockResolvedValue(null), savePreference: vi.fn().mockResolvedValue(undefined) }))
const mockDb = vi.hoisted(() => ({ preferences: { get: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue('key') }, seniorityLists: { add: vi.fn(), put: vi.fn(), bulkAdd: vi.fn() }, seniorityEntries: { add: vi.fn(), put: vi.fn(), bulkAdd: vi.fn() } }))
vi.mock('~/stores/seniority', () => ({ useSeniorityStore: () => mockStore }))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))
vi.mock('~/utils/db', () => ({ db: mockDb }))

async function waitFor(cond: () => boolean) {
  for (let i = 0; i < 200 && !cond(); i++) await new Promise(r => setTimeout(r, 10))
  await nextTick()
}

beforeEach(() => {
  _resetCoreSingletons()
  resetMockStores(mockStore, mockUserStore)
  vi.clearAllMocks()
})

describe('useLandingShowcase', () => {
  it('becomes ready, gives a child a Standing for the demo pilot, and writes nothing', async () => {
    let showcase!: ReturnType<typeof useLandingShowcase>
    let standing!: ReturnType<typeof useStanding>
    const Child = defineComponent({
      setup() {
        standing = useStanding()
        return () => null
      },
    })
    const Parent = defineComponent({
      components: { Child },
      setup() {
        showcase = useLandingShowcase()
        return { ready: showcase.ready }
      },
      template: '<Child />',
    })
    await mountSuspended(Parent)
    await waitFor(() => showcase.ready.value)

    expect(showcase.error.value).toBeNull()
    expect(showcase.ready.value).toBe(true)
    expect(showcase.diffRows.value.length).toBeGreaterThan(0)
    expect(standing.rankCard.value.rank).not.toBeNull()
    expect(standing.rankCard.value.seniorityNumber).toBeGreaterThan(0)

    expect(mockStore.addList).not.toHaveBeenCalled()
    expect(mockStore.getEntriesForList).not.toHaveBeenCalled()
    expect(mockUserStore.savePreference).not.toHaveBeenCalled()
    expect(mockDb.seniorityLists.add).not.toHaveBeenCalled()
    expect(mockDb.seniorityEntries.bulkAdd).not.toHaveBeenCalled()
  })

  it('keeps Scenario state apart from the dashboard through stateKey', async () => {
    let inside!: ReturnType<typeof useScenario>
    const Child = defineComponent({
      setup() {
        inside = useScenario()
        return () => null
      },
    })
    const Parent = defineComponent({
      components: { Child },
      setup() {
        useLandingShowcase()
        return {}
      },
      template: '<Child />',
    })
    await mountSuspended(Parent)
    const outside = useScenario()
    inside.growthAssumptions.value = { enabled: true, annualGrowthRate: 0.07 }
    expect(outside.growthAssumptions.value.annualGrowthRate).not.toBe(0.07)
    expect(outside.growthAssumptions.value.enabled).toBe(false)
  })
})

describe('useSeniorityCore injection', () => {
  it('returns the injected core inside a provider and the store core outside', async () => {
    const fake = { stateKey: 'x:' } as unknown as SeniorityCore
    let inside!: SeniorityCore
    const Child = defineComponent({
      setup() {
        inside = useSeniorityCore()
        return () => null
      },
    })
    const Parent = defineComponent({
      components: { Child },
      setup() {
        provideSeniorityCore(fake)
        return {}
      },
      template: '<Child />',
    })
    await mountSuspended(Parent)
    expect(inside).toBe(fake)
    const outside = useSeniorityCore()
    expect(outside).not.toBe(fake)
    expect(outside.stateKey).toBeUndefined()
  })
})
