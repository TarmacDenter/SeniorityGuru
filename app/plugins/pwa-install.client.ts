import { deferredInstallPrompt, type BeforeInstallPromptEvent } from '~/utils/pwa-prompt'

/**
 * Registers the beforeinstallprompt listener at plugin time — before any
 * component setup runs — so the event is never missed.
 */
export default defineNuxtPlugin(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt.value = e as BeforeInstallPromptEvent
  })
})
