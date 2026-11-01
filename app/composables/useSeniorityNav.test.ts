import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { NavigationMenuItem } from '@nuxt/ui'

const { mockRoute, mockUnseen } = vi.hoisted(() => ({
  mockRoute: { path: '/dashboard/current/status', query: {} as Record<string, string> },
  mockUnseen: { value: false },
}))

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useChangelog', () => () => ({ hasUnseenChanges: mockUnseen }))

beforeEach(() => {
  mockRoute.path = '/dashboard/current/status'
  mockRoute.query = {}
  mockUnseen.value = false
})

async function nav() {
  const { useSeniorityNav } = await import('./useSeniorityNav')
  return useSeniorityNav().value as NavigationMenuItem[][]
}

describe('useSeniorityNav', () => {
  it('shows the four sections, then Upload, Compare and Settings below a divider', async () => {
    const groups = await nav()
    expect(groups.map(group => group.map(item => item.label))).toEqual([
      ['Current', 'Trajectory', 'Demographics', 'List'],
      ['Upload', 'Compare', 'Settings'],
    ])
  })

  it('leaves What\'s New to Settings and marks Settings when there is something new', async () => {
    mockUnseen.value = true
    const groups = await nav()
    expect(groups.flat().some(item => item.label === "What's New")).toBe(false)
    expect(groups[1]!.find(item => item.label === 'Settings')!.chip).toBeTruthy()
  })

  it.each([
    ['/dashboard/current/holdability', 'Current'],
    ['/dashboard/trajectory/retirements', 'Trajectory'],
    ['/dashboard/demographics', 'Demographics'],
    ['/dashboard/list/uploads', 'List'],
    ['/settings', undefined],
  ])('on %s marks %s as the current section', async (path, label) => {
    mockRoute.path = path
    const groups = await nav()
    expect(groups[0]!.filter(item => item.active).map(item => item.label)).toEqual(label ? [label] : [])
  })

  it('opens each section at its first small view, keeping the chosen list', async () => {
    mockRoute.query = { list: '4' }
    const groups = await nav()
    expect(groups[0]!.map(item => item.to)).toEqual([
      { path: '/dashboard/current/status', query: { list: '4' } },
      { path: '/dashboard/trajectory/projection', query: { list: '4' } },
      { path: '/dashboard/demographics', query: { list: '4' } },
      { path: '/dashboard/list/full', query: { list: '4' } },
    ])
  })
})
