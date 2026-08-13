import { defineStore } from 'pinia'
import type { LocalImportAttempt } from '~/utils/db'
import { db } from '~/utils/db'
import { createLogger } from '~/utils/logger'

const MAX_ATTEMPTS = 5
const MAX_BYTES = 50 * 1024 * 1024
const log = createLogger('import-attempts-store')

export interface ImportAttemptInput {
  readonly id: string
  readonly pluginId: string
  readonly data: unknown
}

function newestFirst(attempts: LocalImportAttempt[]) {
  return attempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Owns local diagnostic retention. A storage failure never becomes an import failure. */
export const useImportAttemptsStore = defineStore('import-attempts', () => {
  const attempts = ref<LocalImportAttempt[]>([])

  async function load() {
    attempts.value = newestFirst(await db.importAttempts.toArray())
  }

  async function retain() {
    const ordered = newestFirst(await db.importAttempts.toArray())
    let size = 0
    const remove: string[] = []
    for (const attempt of ordered) {
      size += attempt.size
      if (ordered.indexOf(attempt) >= MAX_ATTEMPTS || size > MAX_BYTES) remove.push(attempt.id)
    }
    if (remove.length) await db.importAttempts.bulkDelete(remove)
    attempts.value = ordered.filter(attempt => !remove.includes(attempt.id))
  }

  async function record(input: ImportAttemptInput) {
    try {
      const data = JSON.stringify(input.data)
      await db.importAttempts.put({ id: input.id, pluginId: input.pluginId, data, size: new Blob([data]).size, createdAt: new Date().toISOString() })
      await retain()
    } catch (error) {
      log.warn('Could not store import diagnostic', { error: String(error) })
    }
  }

  async function remove(id: string) {
    await db.importAttempts.delete(id)
    attempts.value = attempts.value.filter(attempt => attempt.id !== id)
  }

  async function clear() {
    await db.importAttempts.clear()
    attempts.value = []
  }

  function exportAttempt(id: string): string | null {
    return attempts.value.find(attempt => attempt.id === id)?.data ?? null
  }

  return { attempts, load, record, remove, clear, exportAttempt }
})
