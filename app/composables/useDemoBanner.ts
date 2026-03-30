import { emitHook } from '~/utils/hooks'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

export function useDemoBanner() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  const dismissed = ref(false)

  const hasDemoLists = computed(() => seniorityStore.lists.some(l => l.isDemo))
  const showBanner = computed(() => hasDemoLists.value && !dismissed.value)
  const showBadge = computed(() => hasDemoLists.value && dismissed.value)

  onMounted(async () => {
    const val = await userStore.getPreference('demoBannerDismissed')
    dismissed.value = val ?? false
  })

  async function dismiss() {
    await userStore.savePreference('demoBannerDismissed', true)
    dismissed.value = true
  }

  async function exit() {
    await emitHook('app:demo:exit')
  }

  return { showBanner, showBadge, hasDemoLists, dismiss, exit }
}
