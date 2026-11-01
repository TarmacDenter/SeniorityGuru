// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { resolveTab, VALID_TABS, DEFAULT_TAB } from './dashboard-tabs'

describe('dashboard-tabs', () => {
  describe('resolveTab', () => {
    it('opens Now when no tab is given', () => {
      expect(resolveTab(undefined)).toBe('now')
    })

    it('keeps the four panel values', () => {
      for (const tab of VALID_TABS) expect(resolveTab(tab)).toBe(tab)
    })

    it.each([
      ['status', 'now'],
      ['overview', 'now'],
      ['trajectory', 'next'],
      ['projections', 'next'],
      ['position', 'qualifications'],
      ['demographics', 'qualifications'],
      ['seniority', 'lists'],
      ['retirements', 'lists'],
    ])('maps the old ?tab=%s link to %s', (old, panel) => {
      expect(resolveTab(old)).toBe(panel)
    })

    it('falls back to Now for unknown values', () => {
      expect(resolveTab('unknown')).toBe(DEFAULT_TAB)
      expect(resolveTab('analytics')).toBe(DEFAULT_TAB)
      expect(resolveTab('')).toBe(DEFAULT_TAB)
    })
  })

  describe('VALID_TABS', () => {
    it('lists the four panels in order', () => {
      expect([...VALID_TABS]).toEqual(['now', 'next', 'qualifications', 'lists'])
    })
  })
})
