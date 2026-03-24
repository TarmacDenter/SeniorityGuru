import { deferredInstallPrompt, sharedShowIosModal } from '~/utils/pwa-prompt'
import { isStandaloneMode } from '~/utils/pwa-standalone'
import { useUserStore } from '~/stores/user'

export function usePwaInstall() {
  const userStore = useUserStore()
  const dismissed = ref(false)
  const snoozedUntil = ref<Date | null>(null)

  const isIos = import.meta.client
    ? /iphone|ipad|ipod/i.test(navigator.userAgent)
    : false

  const standalone = isStandaloneMode()

  const showBanner = computed(() => {
    if (standalone) return false
    if (dismissed.value) return false
    if (snoozedUntil.value && new Date() < snoozedUntil.value) return false
    if (import.meta.dev) return true
    return !!deferredInstallPrompt.value || isIos
  })

  onMounted(async () => {
    const [dismissedVal, snoozeVal] = await Promise.all([
      userStore.getPreference('pwa-dismissed'),
      userStore.getPreference('pwa-snoozed-until'),
    ])

    dismissed.value = dismissedVal === 'true'
    snoozedUntil.value = snoozeVal ? new Date(snoozeVal) : null
  })

  async function install() {
    if (isIos) {
      sharedShowIosModal.value = true
      return
    }
    const prompt = deferredInstallPrompt.value
    if (!prompt) {
      if (import.meta.dev) console.info('[PWA] No install prompt available — in production, Chrome fires beforeinstallprompt here')
      return
    }
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      deferredInstallPrompt.value = null
    }
  }

  async function snooze() {
    const until = new Date()
    until.setDate(until.getDate() + 7)
    await userStore.savePreference('pwa-snoozed-until', until.toISOString())
    snoozedUntil.value = until
  }

  async function dismiss() {
    await userStore.savePreference('pwa-dismissed', 'true')
    dismissed.value = true
  }

  return { showBanner, isIos, showIosModal: sharedShowIosModal, standalone, install, snooze, dismiss }
}
