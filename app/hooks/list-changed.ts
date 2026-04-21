import { defineHook } from '~/utils/hooks'
import { useSeniorityStore } from '~/stores/seniority'

defineHook('list:changed', async () => {
  await useSeniorityStore().fetchLists()
})
