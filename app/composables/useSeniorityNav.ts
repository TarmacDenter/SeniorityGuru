import type { NavigationMenuItem } from '@nuxt/ui'
import { useMediaQuery } from '@vueuse/core'
import { useDashboardTabs, DASHBOARD_TABS } from '~/composables/useDashboardTabs'
import type { DashboardTab } from '~/utils/dashboard-tabs'

export function useSeniorityNav(): ComputedRef<NavigationMenuItem[]> {
  const route = useRoute()
  const { activeTab } = useDashboardTabs()
  const sidebarOpen = useState<boolean>('dashboardSidebarOpen', () => false)
  // SSR-safe: returns false on server, reactive on client
  const isMobile = useMediaQuery('(max-width: 639px)')
  const { hasUnseenChanges } = useChangelog()

  return computed(() => {
    const onDashboard = route.path === '/dashboard'
    const showTabChildren = isMobile.value && onDashboard

    const dashboardItem: NavigationMenuItem = showTabChildren
      ? {
          label: 'Dashboard',
          icon: 'i-lucide-layout-dashboard',
          type: 'trigger',
          defaultOpen: true,
          children: DASHBOARD_TABS.map(tab => ({
            label: tab.label as string,
            icon: tab.icon as string,
            // NavigationMenuChildItem uses class for active indication (no active prop)
            class: activeTab.value === tab.value
              ? 'bg-primary/10 !text-primary font-medium'
              : '',
            onSelect: (e: Event) => {
              e.preventDefault()
              activeTab.value = tab.value as DashboardTab
              sidebarOpen.value = false
            },
          })),
        }
      : {
          label: 'Dashboard',
          icon: 'i-lucide-layout-dashboard',
          to: '/dashboard',
        }

    const items: NavigationMenuItem[] = [
      dashboardItem,
      { label: 'My Lists', icon: 'i-lucide-list', to: '/seniority/lists' },
      { label: 'Upload', icon: 'i-lucide-upload', to: '/seniority/upload' },
      { label: 'Compare', icon: 'i-lucide-git-compare-arrows', to: '/seniority/compare' },
      {
        label: "What's New",
        icon: 'i-lucide-sparkles',
        to: '/whats-new',
        chip: hasUnseenChanges.value ? { inset: true, color: 'primary' as const } : false,
      },
      { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
    ]

    return items
  })
}
