import type { NavigationMenuItem } from '@nuxt/ui'
import { DASHBOARD_ACTIONS, DASHBOARD_INFO_LINKS } from '~/utils/dashboard-sections'
import { useDashboardSections } from '~/composables/useDashboardSections'

/**
 * App navigation in three groups: the four dashboard sections, the occasional actions (Upload, Compare, Settings), then reference pages (How it works).
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
    DASHBOARD_INFO_LINKS.map(link => ({
      label: link.label,
      icon: link.icon,
      to: link.to,
      active: route.path === link.to,
    })),
  ])
}
