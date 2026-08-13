import { useImportAttemptsStore } from '~/stores/import-attempts'

/** Coordinates local import diagnostics for Settings components. */
export function useImportAttempts() {
  const store = useImportAttemptsStore()

  async function load() { await store.load() }
  async function remove(id: string) { await store.remove(id) }
  async function clear() { await store.clear() }
  function exportAttempt(id: string) { return store.exportAttempt(id) }

  return { attempts: storeToRefs(store).attempts, load, remove, clear, exportAttempt }
}
