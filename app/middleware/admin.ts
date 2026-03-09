import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()

  if (!userStore.profile) {
    await userStore.fetchProfile()
  }

  if (!userStore.isAdmin) {
    return navigateTo('/')
  }
})
