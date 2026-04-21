import type { NuxtApp } from '#app'
import { defineHook } from '~/utils/hooks'
import { useSeniorityStore } from '~/stores/seniority'

export default function registerListChangedHook(nuxtApp: NuxtApp) {
  defineHook('list:changed', async () => {
    await useSeniorityStore().fetchLists()
  }, nuxtApp)
}
