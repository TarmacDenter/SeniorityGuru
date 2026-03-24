import { isStandaloneMode } from '~/utils/pwa-standalone'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/' && isStandaloneMode()) {
    return navigateTo('/dashboard', { replace: true })
  }
})
