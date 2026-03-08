import { createLogger } from '#shared/utils/logger'

const log = createLogger('client')

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    log.error('Unhandled Vue error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      info,
      component: instance?.$options?.__name,
    })
  }

  nuxtApp.hook('vue:error', (error, instance, info) => {
    log.error('Vue error hook', {
      error: error instanceof Error ? error.message : String(error),
      info,
    })
  })
})
