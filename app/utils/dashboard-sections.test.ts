// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { DASHBOARD_SECTIONS, DEFAULT_DASHBOARD_PATH, dashboardPathForTab, dashboardPathForSection } from './dashboard-sections'

describe('dashboard sections', () => {
  it('names the four sections and their small views in order', () => {
    expect(DASHBOARD_SECTIONS.map(section => [section.label, section.views.map(view => view.label)])).toEqual([
      ['Current', ['Status', 'Holdability']],
      ['Trajectory', ['Projection', 'Retirements']],
      ['Demographics', []],
      ['List', ['Full list', 'Upcoming retirements', 'Compare', 'Uploads']],
    ])
  })

  it('opens Current › Status first', () => {
    expect(DEFAULT_DASHBOARD_PATH).toBe('/dashboard/current/status')
  })

  describe('old ?tab= links', () => {
    it.each([
      // four-panel names
      ['now', '/dashboard/current/status'],
      ['next', '/dashboard/trajectory/projection'],
      ['qualifications', '/dashboard/current/holdability'],
      ['lists', '/dashboard/list/full'],
      // six-tab names
      ['status', '/dashboard/current/status'],
      ['overview', '/dashboard/current/status'],
      ['trajectory', '/dashboard/trajectory/projection'],
      ['projections', '/dashboard/trajectory/projection'],
      ['position', '/dashboard/current/holdability'],
      ['demographics', '/dashboard/demographics'],
      ['seniority', '/dashboard/list/full'],
      ['retirements', '/dashboard/list/retirements'],
    ])('sends ?tab=%s to %s', (tab, path) => {
      expect(dashboardPathForTab(tab)).toBe(path)
    })

    it.each([undefined, '', 'unknown', 'constructor'])('sends %s to Current › Status', (tab) => {
      expect(dashboardPathForTab(tab)).toBe('/dashboard/current/status')
    })
  })

  describe('section addresses without a small view', () => {
    it.each([
      ['current', '/dashboard/current/status'],
      ['trajectory', '/dashboard/trajectory/projection'],
      ['demographics', '/dashboard/demographics'],
      ['list', '/dashboard/list/full'],
      ['nonsense', '/dashboard/current/status'],
      [undefined, '/dashboard/current/status'],
    ])('sends /dashboard/%s to %s', (section, path) => {
      expect(dashboardPathForSection(section)).toBe(path)
    })
  })
})
