import type { NavigationMenuItem } from '@nuxt/ui'
import { DASHBOARD_ACTIONS } from '~/utils/dashboard-sections'
import { useDashboardSections } from '~/composables/useDashboardSections'

/**
 * App navigation in two groups: the four dashboard sections, then the occasional actions (Upload, Compare, Settings).
 * The sidebar shows them with a divider between; the phone bottom bar shows the sections and puts the actions under More.
 * What's New is reached from Settings, which carries its unseen marker.
 */
export function useSeniorityNav(): ComputedRef<NavigationMenuItem[][]> {
  const route = useRoute()
  const { sectionItems } = useDashboardSections()
  const { hasUnseenChanges } = useChangelog()

  return computed(() => [
    sectionItems.value,
    DASHBOARD_ACTIONS.map(action => ({
      label: action.label,
      icon: action.icon,
      to: action.to,
      active: route.path === action.to || route.path.startsWith(`${action.to}/`),
      ...(action.to === '/settings' ? { chip: hasUnseenChanges.value ? { inset: true, color: 'primary' as const } : false } : {}),
    })),
  ])
}
