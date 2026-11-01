export const VALID_TABS = ['now', 'next', 'qualifications', 'lists'] as const
export type DashboardTab = typeof VALID_TABS[number]
export const DEFAULT_TAB: DashboardTab = 'now'

/** Old `?tab=` values (six-tab dashboard and earlier) and the panel each one opens. */
const LEGACY_TABS: Record<string, DashboardTab> = {
  overview: 'now',
  status: 'now',
  projections: 'next',
  trajectory: 'next',
  position: 'qualifications',
  demographics: 'qualifications',
  seniority: 'lists',
  retirements: 'lists',
}

export function resolveTab(raw: string | undefined): DashboardTab {
  if (!raw) return DEFAULT_TAB
  if (VALID_TABS.includes(raw as DashboardTab)) return raw as DashboardTab
  return Object.hasOwn(LEGACY_TABS, raw) ? LEGACY_TABS[raw]! : DEFAULT_TAB
}
