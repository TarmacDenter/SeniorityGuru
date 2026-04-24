import type { NuxtApp } from '#app'
import { defineHook } from '~/utils/hooks'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

export default function registerDemoExitHook(nuxtApp: NuxtApp) {
  defineHook('app:demo:exit', async () => {
    const seniorityStore = useSeniorityStore()
    const userStore = useUserStore()

    await seniorityStore.deleteDemoLists()
    await userStore.clearPreferences()
    await navigateTo('/dashboard')
  }, nuxtApp)
}
