import { describe, it, expect } from 'vitest'
import { _useProgressTracker } from './_useProgressTracker'

describe('_useProgressTracker', () => {
  it('starts idle with no percent', () => {
    const tracker = _useProgressTracker()
    expect(tracker.phase.value).toBe('idle')
    expect(tracker.percent.value).toBeNull()
    expect(tracker.busy.value).toBe(false)
  })

  it('enter() sets phase and busy without percent', () => {
    const tracker = _useProgressTracker()
    tracker.enter('reading')
    expect(tracker.phase.value).toBe('reading')
    expect(tracker.busy.value).toBe(true)
    expect(tracker.percent.value).toBeNull()
  })

  it('report() sets phase and computes percent', () => {
    const tracker = _useProgressTracker()
    tracker.report('mapping', 250, 1000)
    expect(tracker.phase.value).toBe('mapping')
    expect(tracker.percent.value).toBe(25)
    expect(tracker.busy.value).toBe(true)
  })

  it('idle() resets everything', () => {
    const tracker = _useProgressTracker()
    tracker.report('validating', 500, 1000)
    tracker.idle()
    expect(tracker.phase.value).toBe('idle')
    expect(tracker.percent.value).toBeNull()
    expect(tracker.busy.value).toBe(false)
  })

  it('handles zero total without crashing', () => {
    const tracker = _useProgressTracker()
    tracker.report('mapping', 0, 0)
    expect(tracker.percent.value).toBeNull()
  })
})
