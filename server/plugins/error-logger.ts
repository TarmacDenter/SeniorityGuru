import { createLogger } from '#shared/utils/logger'

const log = createLogger('server')

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const url = event ? getRequestURL(event).pathname : 'unknown'
    const method = event ? getMethod(event) : 'unknown'

    log.error('Unhandled server error', {
      url,
      method,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  })
})
