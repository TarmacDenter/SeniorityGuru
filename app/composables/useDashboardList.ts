import { useSeniorityLists } from '~/composables/seniority'
import { useDemoBanner } from '~/composables/useDemoBanner'
import { formatDate } from '~/utils/date'

/**
 * The Seniority List the dashboard sections read. The dashboard page loads it once and syncs `?list=`;
 * every small view reads the same selection and loading state (useState), so switching views keeps the list.
 */
export function useDashboardList() {
  const { lists } = useSeniorityLists()
  const { showBadge: showDemoBadge } = useDemoBanner()
  const selectedListId = useState<number | undefined>('dashboardSelectedListId', () => undefined)
  const loading = useState<boolean>('dashboardListLoading', () => true)

  const listOptions = computed(() => lists.value.map((list, index) => ({
    id: list.id,
    label: list.title ? `${list.title} (${formatDate(list.effectiveDate)})` : formatDate(list.effectiveDate),
    isLatest: index === 0,
  })))
  const isHistorical = computed(() => {
    if (!selectedListId.value || listOptions.value.length === 0) return false
    return selectedListId.value !== listOptions.value[0]?.id
  })
  const selectedList = computed(() => lists.value.find(list => list.id === selectedListId.value))
  const selectedListLabel = computed(() => listOptions.value.find(option => option.id === selectedListId.value)?.label ?? null)
  const isDemoList = computed(() => !!selectedList.value?.isDemo && showDemoBadge.value)
  const navbarDescription = computed(() => {
    const list = selectedList.value
    return list ? `${list.title || 'Seniority List'} · effective ${list.effectiveDate}` : undefined
  })

  return { lists, selectedListId, loading, listOptions, isHistorical, selectedList, selectedListLabel, isDemoList, navbarDescription }
}
