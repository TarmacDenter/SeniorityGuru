export const VALID_TABS = ['status', 'demographics', 'position', 'retirements', 'projections', 'seniority'] as const
export type DashboardTab = typeof VALID_TABS[number]
export const DEFAULT_TAB: DashboardTab = 'status'

/** Resolve a raw query param to a valid dashboard tab, with backward-compat mapping. */
export function resolveTab(raw: string | undefined): DashboardTab {
  if (raw === 'overview') return 'status'
  if (VALID_TABS.includes(raw as DashboardTab)) return raw as DashboardTab
  return DEFAULT_TAB
}
