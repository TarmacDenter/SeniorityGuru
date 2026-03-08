/**
 * Structured logger for Cloudflare Workers / browser console.
 *
 * On the server (Cloudflare Workers), `console.*` output is captured by
 * `wrangler tail` and the Workers dashboard. On the client it goes to
 * the browser devtools console.
 *
 * All log entries are JSON-structured so they can be parsed by a future
 * KV-based log collector or external log drain.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  scope: string
  message: string
  data?: Record<string, unknown>
  timestamp: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// In production, suppress debug logs
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function emit(entry: LogEntry) {
  const { level } = entry
  const serialized = JSON.stringify(entry)

  switch (level) {
    case 'debug':
      console.debug(serialized)
      break
    case 'info':
      console.info(serialized)
      break
    case 'warn':
      console.warn(serialized)
      break
    case 'error':
      console.error(serialized)
      break
  }
}

export interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void
  info: (message: string, data?: Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, data?: Record<string, unknown>) => void
}

/**
 * Create a scoped logger instance.
 *
 * @param scope - A short label identifying the subsystem (e.g. "auth", "seniority-api", "upload")
 */
export function createLogger(scope: string): Logger {
  function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (!shouldLog(level)) return
    emit({
      level,
      scope,
      message,
      data,
      timestamp: new Date().toISOString(),
    })
  }

  return {
    debug: (message, data?) => log('debug', message, data),
    info: (message, data?) => log('info', message, data),
    warn: (message, data?) => log('warn', message, data),
    error: (message, data?) => log('error', message, data),
  }
}
