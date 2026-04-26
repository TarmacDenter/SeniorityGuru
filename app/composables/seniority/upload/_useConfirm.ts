import type { DateValue } from 'reka-ui'
import type { ConfirmPhase, ConfirmPhaseOptions } from './types'
import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { useSeniorityStore } from '~/stores/seniority'
import { createSnapshot } from '~/utils/seniority-engine/snapshot'
import { createLogger } from '~/utils/logger'

const log = createLogger('upload:confirm')

export function _useConfirm(opts: ConfirmPhaseOptions): ConfirmPhase & { _reset: () => void } {
  const effectiveDate = ref<DateValue | null>(null)
  const title = ref('')
  const saving = ref(false)

  async function save(entries: Partial<SeniorityEntry>[]): Promise<number> {
    saving.value = true
    opts.error.value = null
    log.info('Upload started', { entryCount: entries.length, effectiveDate: effectiveDate.value?.toString() })

    try {
      createSnapshot(entries as SeniorityEntry[])

      const store = useSeniorityStore()
      const localEntries = (entries as SeniorityEntry[]).map(e => ({
        seniorityNumber: e.seniority_number,
        employeeNumber: e.employee_number,
        name: e.name ?? null,
        seat: e.seat,
        base: e.base,
        fleet: e.fleet,
        hireDate: e.hire_date,
        retireDate: e.retire_date,
      }))

      await store.addList(
        {
          title: title.value || null,
          effectiveDate: effectiveDate.value ? effectiveDate.value.toString() : '',
        },
        localEntries,
      )

      log.info('Upload succeeded', { count: localEntries.length })
      return localEntries.length
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      log.error('Upload failed', { error: message })
      opts.error.value = message
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
