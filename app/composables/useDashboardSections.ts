import type { NavigationMenuItem } from '@nuxt/ui'
import { DASHBOARD_SECTIONS, dashboardSectionForPath, keepQuery } from '~/utils/dashboard-sections'

/**
 * The dashboard section the route is in, its small-view tabs, and the section links for the sidebar and bottom bar.
 * Links carry `?list=` so a chosen list stays chosen while moving between sections.
 */
export function useDashboardSections() {
  const route = useRoute()
  const section = computed(() => dashboardSectionForPath(route.path))
  const listQuery = computed(() => keepQuery(route.query, ['list']))

  const viewItems = computed<NavigationMenuItem[]>(() => (section.value?.views ?? []).map(view => ({
    label: view.label,
    to: { path: view.path, query: listQuery.value },
    active: route.path === view.path,
  })))

  const sectionItems = computed<NavigationMenuItem[]>(() => DASHBOARD_SECTIONS.map(item => ({
    label: item.label,
    icon: item.icon,
    to: { path: item.path, query: listQuery.value },
    active: section.value?.key === item.key,
  })))

  return { section, viewItems, sectionItems }
}
