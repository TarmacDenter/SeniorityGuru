export const VALID_TABS = ['status', 'demographics', 'position', 'trajectory', 'seniority'] as const
export type DashboardTab = typeof VALID_TABS[number]
export const DEFAULT_TAB: DashboardTab = 'status'

export function resolveTab(raw: string | undefined): DashboardTab {
  if (raw === 'overview') return 'status'
  if (raw === 'retirements' || raw === 'projections') return 'trajectory'
  if (VALID_TABS.includes(raw as DashboardTab)) return raw as DashboardTab
  return DEFAULT_TAB
}
