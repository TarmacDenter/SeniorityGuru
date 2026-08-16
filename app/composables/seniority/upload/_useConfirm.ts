import type { DateValue } from 'reka-ui'
import type { ConfirmPhase, UploadSession } from './types'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { useSeniorityStore } from '~/stores/seniority'
import { createSnapshot } from '~/utils/seniority-engine/snapshot'
import { createLogger } from '~/utils/logger'
import { useImportAttemptsStore } from '~/stores/import-attempts'

const log = createLogger('upload:confirm')

export function _useConfirm(opts: UploadSession): ConfirmPhase & { _reset: () => void } {
  const effectiveDate = ref<DateValue | null>(null)
  const title = ref('')
  const saving = ref(false)

  async function save(entries: SeniorityEntry[]): Promise<number> {
    saving.value = true
    opts.error.value = null
    log.info('Upload started', { entryCount: entries.length, effectiveDate: effectiveDate.value?.toString() })

    try {
      createSnapshot(entries)

      const store = useSeniorityStore()
      const localEntries = entries.map(e => ({
        seniorityNumber: e.seniority_number,
        employeeNumber: e.employee_number,
        name: e.name ?? null,
        seat: e.seat,
        base: e.base,
        fleet: e.fleet,
        hireDate: e.hire_date,
        retireDate: e.retire_date,
      }))

      const listId = await store.addList(
        {
          title: title.value || null,
          effectiveDate: effectiveDate.value ? effectiveDate.value.toString() : '',
        },
        localEntries,
      )
      if (opts.importAttemptId?.value) {
        await useImportAttemptsStore().complete(opts.importAttemptId.value, {
          outcome: 'saved',
          listId,
          finalEntries: entries,
        })
      }
      log.info('Upload succeeded', { count: localEntries.length })
      return localEntries.length
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      log.error('Upload failed', { error: message })
      opts.error.value = message
      if (opts.importAttemptId?.value) {
        await useImportAttemptsStore().complete(opts.importAttemptId.value, { outcome: 'failed', error: message })
      }
      throw err
    } finally {
      saving.value = false
    }
  }

  function reset() {
    effectiveDate.value = null
    title.value = ''
    saving.value = false
  }

  return {
    effectiveDate: effectiveDate as Ref<DateValue | null>,
    title,
    saving: saving as Readonly<Ref<boolean>>,
    error: opts.error,
    save,
    _reset: reset,
  }
}
