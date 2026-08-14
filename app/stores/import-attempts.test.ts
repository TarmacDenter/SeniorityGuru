import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const records = vi.hoisted(() => [] as Array<{ id: string, createdAt: string, pluginId: string, data: string, size: number }>)
vi.mock('~/utils/db', () => ({
  db: { importAttempts: {
    toArray: vi.fn(async () => [...records]),
    get: vi.fn(async (id: string) => records.find(item => item.id === id)),
    put: vi.fn(async (record) => { const index = records.findIndex(item => item.id === record.id); if (index >= 0) records[index] = record; else records.push(record) }),
    bulkDelete: vi.fn(async (ids: string[]) => { for (const id of ids) { const index = records.findIndex(item => item.id === id); if (index >= 0) records.splice(index, 1) } }),
    delete: vi.fn(async (id: string) => { const index = records.findIndex(item => item.id === id); if (index >= 0) records.splice(index, 1) }),
    clear: vi.fn(async () => { records.splice(0) }),
  } },
}))

describe('useImportAttemptsStore', () => {
  beforeEach(() => { records.splice(0); setActivePinia(createPinia()) })

  it('retains only the five newest local diagnostics', async () => {
    const { useImportAttemptsStore } = await import('./import-attempts')
    const store = useImportAttemptsStore()
    for (let index = 0; index < 6; index++) await store.record({ id: String(index), pluginId: 'generic', data: { index } })
    expect(store.attempts).toHaveLength(5)
    expect(records).toHaveLength(5)
  })

  it('does not interrupt an import when completing a diagnostic fails', async () => {
    const { useImportAttemptsStore } = await import('./import-attempts')
    const store = useImportAttemptsStore()
    const dbModule = await import('~/utils/db')
    vi.mocked(dbModule.db.importAttempts.get).mockRejectedValueOnce(new Error('quota exceeded'))

    await expect(store.complete('missing', { outcome: 'failed', error: 'Import failed' })).resolves.toBeUndefined()
  })

  it('does not pass a malformed persisted trace to a transition callback', async () => {
    records.push({ id: 'bad', pluginId: 'generic', data: '{"stage":"mapped"}', size: 18, createdAt: '2026-01-01T00:00:00.000Z' })
    const { useImportAttemptsStore } = await import('./import-attempts')
    const store = useImportAttemptsStore()
    const merge = vi.fn()

    await store.updateTrace('bad', merge)

    expect(merge).not.toHaveBeenCalled()
    expect(records[0]!.data).toBe('{"stage":"mapped"}')
  })
})
