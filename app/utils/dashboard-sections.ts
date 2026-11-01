/** A small view inside a dashboard section: its own page and tab. */
export interface DashboardView {
  label: string
  path: string
}

/** One of the four dashboard sections, split by subject (Anchor Pilot or list) and time (today or the future). */
export interface DashboardSection {
  key: 'current' | 'trajectory' | 'demographics' | 'list'
  label: string
  icon: string
  /** Where the section opens: its first small view, or the section page when it has none. */
  path: string
  views: DashboardView[]
  /** Whether the shared Scenario toolbar drives this section. List shows only its list picker. */
  hasScenario: boolean
}

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    key: 'current',
    label: 'Current',
    icon: 'i-lucide-crosshair',
    path: '/dashboard/current/status',
    views: [
      { label: 'Status', path: '/dashboard/current/status' },
      { label: 'Holdability', path: '/dashboard/current/holdability' },
    ],
    hasScenario: true,
  },
  {
    key: 'trajectory',
    label: 'Trajectory',
    icon: 'i-lucide-trending-up',
    path: '/dashboard/trajectory/projection',
    views: [
      { label: 'Projection', path: '/dashboard/trajectory/projection' },
      { label: 'Retirements', path: '/dashboard/trajectory/retirements' },
    ],
    hasScenario: true,
  },
  {
    key: 'demographics',
    label: 'Demographics',
    icon: 'i-lucide-users',
    path: '/dashboard/demographics',
    views: [],
    hasScenario: true,
  },
  {
    key: 'list',
    label: 'List',
    icon: 'i-lucide-list-ordered',
    path: '/dashboard/list/full',
    views: [
      { label: 'Full list', path: '/dashboard/list/full' },
      { label: 'Upcoming retirements', path: '/dashboard/list/retirements' },
      { label: 'Compare', path: '/dashboard/list/compare' },
      { label: 'Uploads', path: '/dashboard/list/uploads' },
    ],
    hasScenario: false,
  },
]

/** Occasional actions below the sections in the sidebar and in the phone More sheet. */
export const DASHBOARD_ACTIONS = [
  { label: 'Upload', icon: 'i-lucide-upload', to: '/seniority/upload' },
  { label: 'Compare', icon: 'i-lucide-git-compare-arrows', to: '/dashboard/list/compare' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
] as const

export const DEFAULT_DASHBOARD_PATH = '/dashboard/current/status'

/** Old `?tab=` values (the six-tab and four-panel dashboards) and the small view that now holds each one's content. */
const LEGACY_TABS: Record<string, string> = {
  now: '/dashboard/current/status',
  status: '/dashboard/current/status',
  overview: '/dashboard/current/status',
  next: '/dashboard/trajectory/projection',
  trajectory: '/dashboard/trajectory/projection',
  projections: '/dashboard/trajectory/projection',
  qualifications: '/dashboard/current/holdability',
  position: '/dashboard/current/holdability',
  demographics: '/dashboard/demographics',
  lists: '/dashboard/list/full',
  seniority: '/dashboard/list/full',
  retirements: '/dashboard/list/retirements',
}

export function dashboardPathForTab(tab: string | undefined): string {
  return tab && Object.hasOwn(LEGACY_TABS, tab) ? LEGACY_TABS[tab]! : DEFAULT_DASHBOARD_PATH
}

export function dashboardPathForSection(key: string | undefined): string {
  return DASHBOARD_SECTIONS.find(section => section.key === key)?.path ?? DEFAULT_DASHBOARD_PATH
}

/** The section a dashboard path belongs to, or undefined outside the dashboard sections. */
export function dashboardSectionForPath(path: string): DashboardSection | undefined {
  return DASHBOARD_SECTIONS.find(section => path === `/dashboard/${section.key}` || path.startsWith(`/dashboard/${section.key}/`))
}

/** The named query values of an old link, carried over to the page it now opens. */
export function keepQuery(query: Record<string, unknown>, keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.flatMap(key => (typeof query[key] === 'string' && query[key] ? [[key, query[key]]] : [])))
}
