import type { ProgressTracker, ProcessingPhase } from './types'

export function _useProgressTracker(): ProgressTracker {
  const phase = ref<ProcessingPhase>('idle')
  const raw = ref<{ current: number; total: number } | null>(null)

  const percent = computed<number | null>(() => {
    if (!raw.value || raw.value.total === 0) return null
    return Math.round((raw.value.current / raw.value.total) * 100)
  })

  const busy = computed(() => phase.value !== 'idle')

  return {
    phase: readonly(phase),
    percent,
    busy,
    report(p, current, total) {
      phase.value = p
      raw.value = { current, total }
    },
    enter(p) {
      phase.value = p
      raw.value = null
    },
    idle() {
      phase.value = 'idle'
      raw.value = null
    },
  }
}
