import { useLocalStorage } from '@vueuse/core'

const lastSeenDate = useLocalStorage('lastSeenChangelogDate', '')

export function useChangelog() {

  const { data: changelogPage } = useAsyncData('changelog', () =>
    queryCollection('changelog').path('/changelog').first(),
  )

  const latestDate = computed(() => changelogPage.value?.latestDate ?? '')

  const hasUnseenChanges = computed(() => {
    if (!latestDate.value) return false
    if (!lastSeenDate.value) return true
    return latestDate.value > lastSeenDate.value
  })

  function markAsSeen() {
    if (latestDate.value) {
      lastSeenDate.value = latestDate.value
    }
  }

  return { changelogPage, hasUnseenChanges, markAsSeen }
}
