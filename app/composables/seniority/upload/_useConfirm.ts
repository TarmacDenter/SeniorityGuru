import type { ConfirmPhase, UploadSession } from './types'
import { toDomainSeniorityEntry, type SeniorityEntry, type SeniorityEntryInput } from '~/utils/schemas/seniority-list'
import { parsePlainDate, type PlainDate } from '~/utils/temporal'
import { useSeniorityStore } from '~/stores/seniority'
import { createSnapshot } from '~/utils/seniority-engine/snapshot'
import { createLogger } from '~/utils/logger'
import { useImportAttemptsStore } from '~/stores/import-attempts'

const log = createLogger('upload:confirm')

export function _useConfirm(opts: UploadSession): ConfirmPhase & { _reset: () => void } {
  const effectiveDate = shallowRef<PlainDate | null>(null)
  const title = ref('')
  const saving = ref(false)

  async function save(entries: (SeniorityEntryInput | SeniorityEntry)[]): Promise<number> {
    saving.value = true
    opts.error.value = null
    log.info('Upload started', { entryCount: entries.length, effectiveDate: effectiveDate.value?.toString() })

    try {
      const domainEntries = entries.map(toDomainSeniorityEntry)
      createSnapshot(domainEntries)

      const store = useSeniorityStore()
      const listId = await store.addList(
        {
          title: title.value || null,
          effectiveDate: effectiveDate.value ?? parsePlainDate('1970-01-01'),
        },
        domainEntries,
      )
      if (opts.importAttemptId?.value) {
        await useImportAttemptsStore().complete(opts.importAttemptId.value, {
          outcome: 'saved',
          listId,
          finalEntries: entries,
        })
      }
      log.info('Upload succeeded', { count: domainEntries.length })
      return domainEntries.length
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
    effectiveDate,
    title,
    saving: saving as Readonly<Ref<boolean>>,
    error: opts.error,
    save,
    _reset: reset,
  }
}
