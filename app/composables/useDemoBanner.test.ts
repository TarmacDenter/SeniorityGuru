// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'

// ── Store mocks ────────────────────────────────────────────────────────────

const mockSeniorityLists = vi.hoisted(() => [] as Array<{ id: number; isDemo?: boolean; title: string | null; effectiveDate: string; createdAt: string }>)

const mockGetPreference = vi.hoisted(() => vi.fn().mockResolvedValue(null))
const mockSavePreference = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockEmitHook = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('~/stores/seniority', () => ({
  useSeniorityStore: () => ({ lists: mockSeniorityLists }),
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    getPreference: mockGetPreference,
    savePreference: mockSavePreference,
  }),
}))

vi.mock('~/utils/hooks', () => ({
  emitHook: mockEmitHook,
  defineHook: vi.fn(),
}))

// ── Helpers ────────────────────────────────────────────────────────────────

async function mountComposable() {
  const { useDemoBanner } = await import('./useDemoBanner')
  let result: ReturnType<typeof useDemoBanner>

  const Wrapper = defineComponent({
    setup() {
      result = useDemoBanner()
      return result
    },
    template: '<div />',
  })

  await mountSuspended(Wrapper)
  await nextTick()

  return result!
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useDemoBanner', () => {
  beforeEach(() => {
    mockSeniorityLists.length = 0
    mockGetPreference.mockReset().mockResolvedValue(null)
    mockSavePreference.mockReset().mockResolvedValue(undefined)
  })

  describe('showBanner', () => {
    it('is true when demo lists exist and banner not dismissed', async () => {
      mockSeniorityLists.push({ id: 1, isDemo: true, title: null, effectiveDate: '2025-01-01', createdAt: '' })
      mockGetPreference.mockResolvedValue(false)

      const { showBanner } = await mountComposable()

      expect(showBanner.value).toBe(true)
    })

    it('is false when no demo lists exist', async () => {
      mockSeniorityLists.push({ id: 1, isDemo: false, title: null, effectiveDate: '2025-01-01', createdAt: '' })

      const { showBanner } = await mountComposable()

      expect(showBanner.value).toBe(false)
    })

    it('is false when lists array is empty', async () => {
      const { showBanner } = await mountComposable()

      expect(showBanner.value).toBe(false)
    })

    it('is false when demo lists exist but banner is dismissed', async () => {
      mockSeniorityLists.push({ id: 1, isDemo: true, title: null, effectiveDate: '2025-01-01', createdAt: '' })
      mockGetPreference.mockResolvedValue(true)

      const { showBanner } = await mountComposable()

      expect(showBanner.value).toBe(false)
    })
  })

  describe('showBadge', () => {
    it('is true when demo lists exist and banner is dismissed', async () => {
      mockSeniorityLists.push({ id: 1, isDemo: true, title: null, effectiveDate: '2025-01-01', createdAt: '' })
      mockGetPreference.mockResolvedValue(true)

      const { showBadge } = await mountComposable()

      expect(showBadge.value).toBe(true)
    })

    it('is false when banner has not been dismissed', async () => {
      mockSeniorityLists.push({ id: 1, isDemo: true, title: null, effectiveDate: '2025-01-01', createdAt: '' })
      mockGetPreference.mockResolvedValue(false)

      const { showBadge } = await mountComposable()

      expect(showBadge.value).toBe(false)
    })

    it('is false when no demo lists exist even if dismissed', async () => {
      mockGetPreference.mockResolvedValue(true)

      const { showBadge } = await mountComposable()

      expect(showBadge.value).toBe(false)
    })
  })

  describe('dismiss()', () => {
    it('saves demoBannerDismissed=true via userStore.savePreference', async () => {
      mockSeniorityLists.push({ id: 1, isDemo: true, title: null, effectiveDate: '2025-01-01', createdAt: '' })

      const { dismiss } = await mountComposable()

      await dismiss()

      expect(mockSavePreference).toHaveBeenCalledWith('demoBannerDismissed', true)
    })

    it('updates dismissed ref so showBanner reacts immediately', async () => {
      mockSeniorityLists.push({ id: 1, isDemo: true, title: null, effectiveDate: '2025-01-01', createdAt: '' })
      mockGetPreference.mockResolvedValue(false)

      const { showBanner, dismiss } = await mountComposable()

      expect(showBanner.value).toBe(true)
      await dismiss()
      await nextTick()
      expect(showBanner.value).toBe(false)
    })
  })

  describe('preferences loaded on mount', () => {
    it('reads demoBannerDismissed from userStore on mount', async () => {
      await mountComposable()

      expect(mockGetPreference).toHaveBeenCalledWith('demoBannerDismissed')
    })
  })

  describe('exit()', () => {
    it('emits the app:demo:exit hook', async () => {
      const { exit } = await mountComposable()

      await exit()

      expect(mockEmitHook).toHaveBeenCalledWith('app:demo:exit')
    })
  })
})
