import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useTrajectoryAssumptionsNote } from './useTrajectoryAssumptionsNote'

const mockUserStore = vi.hoisted(() => ({
  getPreference: vi.fn(),
  savePreference: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('~/stores/user', () => ({ useUserStore: () => mockUserStore }))

beforeEach(() => {
  mockUserStore.getPreference.mockReset().mockResolvedValue(null)
  mockUserStore.savePreference.mockClear()
})

describe('useTrajectoryAssumptionsNote', () => {
  it('shows the note until the pilot dismisses it, and remembers the choice', async () => {
    const note = useTrajectoryAssumptionsNote()
    await flushPromises()
    expect(note.dismissed.value).toBe(false)

    await note.toggle()
    expect(note.dismissed.value).toBe(true)
    expect(mockUserStore.savePreference).toHaveBeenCalledWith('trajectoryAssumptionsDismissed', true)
  })

  it('stays dismissed on the next visit and can be reopened', async () => {
    mockUserStore.getPreference.mockResolvedValue(true)
    const note = useTrajectoryAssumptionsNote()
    await flushPromises()
    expect(note.dismissed.value).toBe(true)

    await note.toggle()
    expect(note.dismissed.value).toBe(false)
    expect(mockUserStore.savePreference).toHaveBeenCalledWith('trajectoryAssumptionsDismissed', false)
  })
})
