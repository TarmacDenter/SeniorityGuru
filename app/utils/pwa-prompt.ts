export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Reactive ref shared between the client plugin (writer) and usePwaInstall (reader). */
export const deferredInstallPrompt = ref<BeforeInstallPromptEvent | null>(null)

/** Shared ref so any component can open the iOS install instructions modal, not just InstallBanner. */
export const sharedShowIosModal = ref(false)
