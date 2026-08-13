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
  readonly outcome?: LocalImportAttempt['outcome']
  readonly sheetName?: string
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

  async function record(input: ImportAttemptInput): Promise<string | null> {
    try {
      const data = JSON.stringify(input.data)
      const now = new Date().toISOString()
      await db.importAttempts.put({
        id: input.id,
        pluginId: input.pluginId,
        data,
        size: new Blob([data]).size,
        createdAt: now,
        updatedAt: now,
        outcome: input.outcome ?? 'review',
        sheetName: input.sheetName,
      })
      await retain()
      return input.id
    } catch (error) {
      log.warn('Could not store import diagnostic', { error: String(error) })
      return null
    }
  }

  async function update(id: string, patch: { data?: unknown, outcome?: LocalImportAttempt['outcome'], listId?: number }) {
    try {
      const existing = await db.importAttempts.get(id)
      if (!existing) return
      const data = patch.data === undefined ? existing.data : JSON.stringify(patch.data)
      await db.importAttempts.put({
        ...existing,
        data,
        size: new Blob([data]).size,
        updatedAt: new Date().toISOString(),
        ...(patch.outcome ? { outcome: patch.outcome } : {}),
        ...(patch.listId !== undefined ? { listId: patch.listId } : {}),
      })
      await retain()
    } catch (error) {
      log.warn('Could not update import diagnostic', { error: String(error) })
    }
  }

  async function complete(id: string, input: { outcome: LocalImportAttempt['outcome'], listId?: number, finalEntries?: unknown, error?: string }) {
    const attempt = await db.importAttempts.get(id)
    if (!attempt) return
    let previous: Record<string, unknown> = {}
    try { previous = JSON.parse(attempt.data) as Record<string, unknown> } catch { /* retain the raw record if it is malformed */ }
    await update(id, {
      outcome: input.outcome,
      listId: input.listId,
      data: {
        ...previous,
        outcome: input.outcome,
        completedAt: new Date().toISOString(),
        ...(input.listId !== undefined ? { savedListId: input.listId } : {}),
        ...(input.finalEntries !== undefined ? { finalEntries: input.finalEntries } : {}),
        ...(input.error ? { error: input.error } : {}),
      },
    })
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

  return { attempts, load, record, update, complete, remove, clear, exportAttempt }
})
