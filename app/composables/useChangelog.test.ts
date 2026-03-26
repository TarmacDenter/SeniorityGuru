// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'

// ---------------------------------------------------------------------------
// Mock @nuxt/content queryCollection
// ---------------------------------------------------------------------------

mockNuxtImport('queryCollection', () => () => ({
  path: () => ({
    first: () => Promise.resolve({
      title: "What's New",
      latestDate: '2026-03-26',
      body: { type: 'root', children: [] },
    }),
  }),
}))

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function mountComposable() {
  const { useChangelog } = await import('./useChangelog')

  let result: ReturnType<typeof useChangelog>

  const Wrapper = defineComponent({
    setup() {
      result = useChangelog()
      return {}
    },
    template: '<div />',
  })

  await mountSuspended(Wrapper)
  await nextTick()

  return result!
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useChangelog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('lastSeenChangelogDate')
    vi.resetModules()
  })

  describe('hasUnseenChanges', () => {
    it('is true when user has never seen the changelog', async () => {
      const { hasUnseenChanges } = await mountComposable()

      expect(hasUnseenChanges.value).toBe(true)
    })

    it('is true when lastSeenDate is older than latestDate', async () => {
      localStorage.setItem('lastSeenChangelogDate', '2026-03-01')

      const { hasUnseenChanges } = await mountComposable()

      expect(hasUnseenChanges.value).toBe(true)
    })

    it('is false when lastSeenDate equals latestDate', async () => {
      localStorage.setItem('lastSeenChangelogDate', '2026-03-26')

      const { hasUnseenChanges } = await mountComposable()

      expect(hasUnseenChanges.value).toBe(false)
    })
  })

  describe('markAsSeen()', () => {
    it('sets lastSeenDate to the latestDate', async () => {
      localStorage.setItem('lastSeenChangelogDate', '2026-01-01')
      const { hasUnseenChanges, markAsSeen } = await mountComposable()
      expect(hasUnseenChanges.value).toBe(true)

      markAsSeen()
      await nextTick()

      expect(hasUnseenChanges.value).toBe(false)
    })

    it('causes hasUnseenChanges to become false', async () => {
      const { hasUnseenChanges, markAsSeen } = await mountComposable()
      expect(hasUnseenChanges.value).toBe(true)

      markAsSeen()
      await nextTick()

      expect(hasUnseenChanges.value).toBe(false)
    })
  })
})
