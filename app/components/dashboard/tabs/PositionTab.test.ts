import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { parsePlainDate, Temporal, type PlainDate } from '~/utils/temporal'
import type { GrowthAssumptions } from '~/utils/seniority'

vi.mock('~/components/dashboard/GrowthBar.vue', () => ({
  default: { name: 'GrowthBar', emits: ['update:modelValue'], template: '<div />' },
}))

const { mockAnchoredAnalysis, mockHasData, mockProjectionEndDate } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockAnchoredAnalysis: vRef(null) as { value: { qualificationPositions: (options: { through: PlainDate; growthAssumptions: GrowthAssumptions }) => { domain: unknown[]; presentation: unknown[] } } | null },
    mockHasData: vRef(false),
    mockProjectionEndDate: vRef(null) as { value: PlainDate | null },
  }
})

mockNuxtImport('useSeniorityCore', () => () => ({
  hasData: mockHasData,
  newHire: {
    enabled: { value: false },
    syntheticEntry: { value: null },
    availableBases: { value: [] },
    availableSeats: { value: [] },
    availableFleets: { value: [] },
    realUserFound: { value: false },
    isConfigured: { value: false },
    retireDate: { value: null },
    selectedBase: { value: null },
    selectedSeat: { value: null },
    selectedFleet: { value: null },
    birthDate: { value: null },
    reset: vi.fn(),
  },
  analysis: { value: null },
  anchoredAnalysis: mockAnchoredAnalysis,
  userEntry: { value: undefined },
  hasAnchor: { value: false },
  isNewHireMode: { value: false },
  projectionEndDate: mockProjectionEndDate,
}))

mockNuxtImport('useStanding', () => () => ({
  rankCard: require('vue').ref({ rosterSize: 260, activePilotCount: 240 }),
}))

mockNuxtImport('useUser', () => () => ({ employeeNumber: { value: null } }))

describe('PositionTab', () => {
  const wrappers: VueWrapper[] = []

  beforeEach(() => {
    mockHasData.value = false
    mockAnchoredAnalysis.value = null
    mockProjectionEndDate.value = parsePlainDate('2040-06-15')
  })

  afterEach(() => {
    wrappers.splice(0).forEach(wrapper => wrapper.unmount())
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  async function mountProjection() {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.spyOn(Temporal.Now, 'plainDateISO').mockReturnValue(parsePlainDate('2026-06-15'))
    mockHasData.value = true
    const qualificationPositions = vi.fn((_options: { through: PlainDate; growthAssumptions: GrowthAssumptions }) => ({ domain: [], presentation: [] }))
    mockAnchoredAnalysis.value = { qualificationPositions }
    const Tab = await import('./PositionTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    wrappers.push(wrapper)
    return { wrapper, qualificationPositions }
  }

  it('discloses Roster Size and active pilots as separate figures', async () => {
    const { wrapper } = await mountProjection()
    expect(wrapper.get('[data-testid="position-roster-size"]').text()).toBe('Roster Size 260 · Active pilots 240')
  })

  it('applies the initial projection immediately when Project forward is enabled', async () => {
    const { wrapper, qualificationPositions } = await mountProjection()
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2026-06-15')
    expect(wrapper.text()).toContain('As of today')

    await wrapper.get('[role="switch"]').trigger('click')

    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2027-06-15')
    expect(wrapper.text()).toContain('+1yr')
    expect(wrapper.text()).toContain('2027-06-15')
    expect(wrapper.text()).not.toContain('As of today')
  })

  it('keeps the applied date until slider changes settle after 500 ms', async () => {
    const { wrapper, qualificationPositions } = await mountProjection()
    await wrapper.get('[role="switch"]').trigger('click')
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.text()).toContain('+3yrs')
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2027-06-15')
    expect(wrapper.text()).toContain('As of 2027-06-15')
    await vi.advanceTimersByTimeAsync(499)
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2027-06-15')
    expect(wrapper.text()).toContain('As of 2027-06-15')

    await vi.advanceTimersByTimeAsync(1)
    await nextTick()
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2029-06-15')
    expect(wrapper.text()).toContain('As of 2029-06-15')
  })

  it.each(['pending', 'applied'] as const)('restores current results and resets %s projection input when disabled', async (state) => {
    const { wrapper, qualificationPositions } = await mountProjection()
    await wrapper.get('[role="switch"]').trigger('click')
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    if (state === 'applied') {
      await vi.advanceTimersByTimeAsync(500)
      expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2028-06-15')
      expect(wrapper.text()).toContain('As of 2028-06-15')
    }
    await wrapper.get('[role="switch"]').trigger('click')

    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false')
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2026-06-15')
    expect(wrapper.text()).toContain('As of today')

    await vi.advanceTimersByTimeAsync(1000)
    await nextTick()
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2026-06-15')
    expect(wrapper.text()).toContain('As of today')
    expect(wrapper.find('[role="slider"]').exists()).toBe(false)

    await wrapper.get('[role="switch"]').trigger('click')
    expect(wrapper.text()).toContain('+1yr')
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2027-06-15')
    expect(wrapper.text()).toContain('As of 2027-06-15')
  })

  it('cancels pending projection work on unmount', async () => {
    const { wrapper, qualificationPositions } = await mountProjection()
    await wrapper.get('[role="switch"]').trigger('click')
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    qualificationPositions.mockClear()
    wrapper.unmount()
    wrappers.pop()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(1000)
    expect(qualificationPositions).not.toHaveBeenCalled()
  })

  it('keeps projection unavailable without a Projection Through Date', async () => {
    const { wrapper, qualificationPositions } = await mountProjection()
    mockProjectionEndDate.value = null
    await nextTick()

    expect(wrapper.get('[role="switch"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Add a retirement date to project forward.')
    await wrapper.get('[role="switch"]').trigger('click')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false')
    expect(wrapper.find('[role="slider"]').exists()).toBe(false)
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2026-06-15')
  })

  it('uses the applied date for Growth Assumptions while slider input is pending', async () => {
    const { wrapper, qualificationPositions } = await mountProjection()
    await wrapper.get('[role="switch"]').trigger('click')
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    wrapper.getComponent({ name: 'GrowthBar' }).vm.$emit('update:modelValue', { enabled: true, annualGrowthRate: 0.03 })
    await nextTick()

    expect(qualificationPositions.mock.lastCall?.[0].growthAssumptions).toEqual({ enabled: true, annualGrowthRate: 0.03 })
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2027-06-15')
    expect(wrapper.text()).toContain('As of 2027-06-15')

    await vi.advanceTimersByTimeAsync(500)
    expect(qualificationPositions.mock.lastCall?.[0].growthAssumptions).toEqual({ enabled: true, annualGrowthRate: 0.03 })
    expect(qualificationPositions.mock.lastCall?.[0].through.toString()).toBe('2028-06-15')
    expect(wrapper.text()).toContain('As of 2028-06-15')
  })

  it('shows empty state when no seniority data', async () => {
    mockHasData.value = false
    const Tab = await import('./PositionTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    wrappers.push(wrapper)
    expect(wrapper.text()).toContain('No Seniority Data')
  })

  it('shows loading skeleton when loading prop is true', async () => {
    const Tab = await import('./PositionTab.vue')
    const wrapper = await mountSuspended(Tab.default, {
      props: { loading: true },
    })
    wrappers.push(wrapper)
    expect(wrapper.html()).toContain('skeleton')
  })

  it('renders anchored qualification-scale holdability states', async () => {
    mockHasData.value = true
    mockAnchoredAnalysis.value = {
      qualificationPositions: () => ({
        domain: [],
        presentation: [
          {
            qualification: { fleet: '737', seat: 'CA', base: 'JFK' },
            activePilotCount: 1,
            rosterSize: 2,
            thresholdPercentile: 60,
            thresholdSeniorityNumber: 100,
            percentile25: 25,
            medianPercentile: 50,
            percentile75: 75,
            maximumPercentile: 100,
            percentileDensity: [],
            projectedPercentile: 70,
            currentPercentile: 60,
            modeledHoldable: true,
          },
          {
            qualification: { fleet: '737', seat: 'FO', base: 'JFK' },
            activePilotCount: 1,
            rosterSize: 2,
            thresholdPercentile: 60,
            thresholdSeniorityNumber: 100,
            percentile25: 25,
            medianPercentile: 50,
            percentile75: 75,
            maximumPercentile: 100,
            percentileDensity: [],
            projectedPercentile: 50,
            currentPercentile: 40,
            modeledHoldable: false,
          },
        ],
      }),
    }
    const Tab = await import('./PositionTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    wrappers.push(wrapper)

    expect(wrapper.findAll('[data-testid="qualification-scale-active-count"]').map(count => count.text())).toEqual([
      'Percentiles measured against 2 on roster · 1 active',
      'Percentiles measured against 2 on roster · 1 active',
    ])
    expect(wrapper.text()).toContain('Heights scale independently for each Qualification')

    const projectedMarkers = wrapper.findAll('[data-testid="qualification-scale-projected-position"]')
    expect(projectedMarkers).toHaveLength(2)
    expect(projectedMarkers[0]!.classes()).toContain('bg-[var(--ui-color-success-500)]')
    expect(projectedMarkers[1]!.classes()).toContain('bg-[var(--ui-color-primary-500)]')
  })
})
