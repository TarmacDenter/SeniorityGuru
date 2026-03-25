export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
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

const MAX_BUFFER_SIZE = 500
const ringBuffer: LogEntry[] = []

const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function emit(entry: LogEntry) {
  ringBuffer.push(entry)
  if (ringBuffer.length > MAX_BUFFER_SIZE) {
    ringBuffer.shift()
  }

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

/** Returns a copy of the ring buffer contents, oldest first. */
export function getLogBuffer(): LogEntry[] {
  return [...ringBuffer]
}

/** Clears all entries from the ring buffer. */
export function clearLogBuffer(): void {
  ringBuffer.length = 0
}

/** Formats the ring buffer as a human-readable text block. */
export function exportLogAsText(): string {
  return ringBuffer
    .map((entry) => {
      const level = `[${entry.level.toUpperCase()}]`
      const scope = `[${entry.scope}]`
      const data = entry.data ? `\n  ${JSON.stringify(entry.data, null, 2)}` : ''
      return `${entry.timestamp} ${level} ${scope} ${entry.message}${data}`
    })
    .join('\n')
}
