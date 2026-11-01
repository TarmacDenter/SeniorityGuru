import type { TabsItem } from '@nuxt/ui'
import { resolveTab, DEFAULT_TAB } from '~/utils/dashboard-tabs'

export const DASHBOARD_TABS: TabsItem[] = [
  { label: 'Now', icon: 'i-lucide-crosshair', value: 'now' },
  { label: 'Next', icon: 'i-lucide-trending-up', value: 'next' },
  { label: 'Qualifications', icon: 'i-lucide-layout-list', value: 'qualifications' },
  { label: 'Lists', icon: 'i-lucide-list-ordered', value: 'lists' },
]

export function useDashboardTabs() {
  const route = useRoute()
  // useState key ensures layout + page share the same reactive ref
  const activeTab = useState('dashboardActiveTab', () =>
    resolveTab(route.query.tab as string | undefined),
  )
  return { activeTab, tabs: DASHBOARD_TABS, DEFAULT_TAB }
}
