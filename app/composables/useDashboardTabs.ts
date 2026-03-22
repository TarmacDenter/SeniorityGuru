import type { TabsItem } from '@nuxt/ui'
import { resolveTab, DEFAULT_TAB } from '~/utils/dashboard-tabs'

export const DASHBOARD_TABS: TabsItem[] = [
  { label: 'My Status', icon: 'i-lucide-user', value: 'status' },
  { label: 'Demographics', icon: 'i-lucide-users', value: 'demographics' },
  { label: 'Position', icon: 'i-lucide-map-pin', value: 'position' },
  { label: 'Trajectory', icon: 'i-lucide-trending-up', value: 'trajectory' },
  { label: 'Seniority List', icon: 'i-lucide-list-ordered', value: 'seniority' },
]

export function useDashboardTabs() {
  const route = useRoute()
  // useState key ensures layout + page share the same reactive ref
  const activeTab = useState('dashboardActiveTab', () =>
    resolveTab(route.query.tab as string | undefined),
  )
  return { activeTab, tabs: DASHBOARD_TABS, DEFAULT_TAB }
}
