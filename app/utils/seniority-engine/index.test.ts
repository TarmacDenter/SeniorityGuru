// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as seniorityEngine from './index'

// @ts-expect-error qualification analytics stay behind seniority lenses.
void seniorityEngine.computeQualSnapshots
// @ts-expect-error qualification analytics stay behind seniority lenses.
void seniorityEngine.computeRetirementWave

describe('seniority-engine root interface', () => {
  it('exports snapshots, scenarios, and lenses', () => {
    expect(seniorityEngine.createSnapshot).toBeTypeOf('function')
    expect(seniorityEngine.createScenario).toBeTypeOf('function')
    expect(seniorityEngine.createLens).toBeTypeOf('function')
  })
})
