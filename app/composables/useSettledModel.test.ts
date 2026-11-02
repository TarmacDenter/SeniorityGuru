import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useSettledModel } from './useSettledModel'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

function setup(initial = 2) {
  const model = ref(initial)
  const scope = effectScope()
  const live = scope.run(() => useSettledModel(model))!
  return { model, live, scope }
}

describe('useSettledModel', () => {
  it('moves live at once and commits to the model only after the control rests', async () => {
    const { model, live, scope } = setup()
    live.value = 4
    await nextTick()
    vi.advanceTimersByTime(100)
    live.value = 5
    await nextTick()
    vi.advanceTimersByTime(200)
    expect(live.value).toBe(5)
    expect(model.value).toBe(2)
    vi.advanceTimersByTime(100)
    expect(model.value).toBe(5)
    scope.stop()
  })

  it('follows the model when it changes elsewhere', async () => {
    const { model, live, scope } = setup()
    model.value = 1
    await nextTick()
    expect(live.value).toBe(1)
    scope.stop()
  })
})
