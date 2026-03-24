// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { resolveTab, VALID_TABS, DEFAULT_TAB } from './dashboard-tabs'

describe('dashboard-tabs', () => {
  describe('resolveTab', () => {
    it('returns "status" for undefined input', () => {
      expect(resolveTab(undefined)).toBe('status')
    })

    it('maps "overview" to "status" for backward compatibility', () => {
      expect(resolveTab('overview')).toBe('status')
    })

    it('resolves "retirements" as a valid tab', () => {
      expect(resolveTab('retirements')).toBe('retirements')
    })

    it('maps "projections" to "trajectory" for backward compatibility', () => {
      expect(resolveTab('projections')).toBe('trajectory')
    })

    it('returns valid tab names unchanged', () => {
      for (const tab of VALID_TABS) {
        expect(resolveTab(tab)).toBe(tab)
      }
    })

    it('returns default for unknown tab values', () => {
      expect(resolveTab('unknown')).toBe(DEFAULT_TAB)
      expect(resolveTab('analytics')).toBe(DEFAULT_TAB)
      expect(resolveTab('')).toBe(DEFAULT_TAB)
    })
  })

  describe('VALID_TABS', () => {
    it('contains all 6 dashboard tabs', () => {
      expect(VALID_TABS).toHaveLength(6)
      expect(VALID_TABS).toContain('status')
      expect(VALID_TABS).toContain('demographics')
      expect(VALID_TABS).toContain('position')
      expect(VALID_TABS).toContain('trajectory')
      expect(VALID_TABS).toContain('seniority')
      expect(VALID_TABS).toContain('retirements')
    })

    it('does not contain retired tab names', () => {
      expect(VALID_TABS).not.toContain('projections')
    })
  })
})
