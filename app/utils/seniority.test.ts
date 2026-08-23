// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as seniority from './seniority'

function assertInternalAndLegacyNamesAreExcluded() {
  // @ts-expect-error Use createSenioritySnapshot.
  void seniority.createSnapshot
  // @ts-expect-error Use createSeniorityLens.
  void seniority.createLens
  // @ts-expect-error Use createSeniorityScenario.
  void seniority.createScenario
  // @ts-expect-error Use calculateSeniorityRank.
  void seniority.computeRank
  // @ts-expect-error Use calculateSeniorityPercentile.
  void seniority.computePercentile
  // @ts-expect-error Number formatting belongs to a domain presentation adapter.
  void seniority.formatNumber
  // @ts-expect-error Qualification Distribution staging is internal to the anchored lens.
  void seniority.computeQualSnapshots
  // @ts-expect-error Qualification Position staging is internal to the anchored lens.
  void seniority.applyProjectionToSnapshots
  // @ts-expect-error Demographic helpers are internal engine composition details.
  void seniority.analyzeAgeDistribution
  // @ts-expect-error Retirement-year helpers are internal engine composition details.
  void seniority.analyzeRetirementYears
  // @ts-expect-error Memoization helpers are not public Seniority Analysis vocabulary.
  void seniority.memoizeLast
  // @ts-expect-error Qualification keys are internal indexes.
  void seniority.qualificationKey
}

void assertInternalAndLegacyNamesAreExcluded

describe('supported Seniority Analysis interface', () => {
  it('exports domain-qualified math, engine, and presentation entry points', () => {
    expect(seniority).toEqual(expect.objectContaining({
      calculateSeniorityRank: expect.any(Function),
      calculateSeniorityPercentile: expect.any(Function),
      calculateSeniorityTrajectory: expect.any(Function),
      createSenioritySnapshot: expect.any(Function),
      createSeniorityScenario: expect.any(Function),
      createSeniorityLens: expect.any(Function),
      analyzeSeniorityQualificationViewer: expect.any(Function),
      presentSeniorityTrajectory: expect.any(Function),
      presentRetirementCountProjection: expect.any(Function),
      formatQualificationScope: expect.any(Function),
    }))
  })

  it('does not expose old aliases or internal helpers at runtime', () => {
    expect(seniority).not.toHaveProperty('createSnapshot')
    expect(seniority).not.toHaveProperty('createLens')
    expect(seniority).not.toHaveProperty('createScenario')
    expect(seniority).not.toHaveProperty('computeRank')
    expect(seniority).not.toHaveProperty('computePercentile')
    expect(seniority).not.toHaveProperty('formatNumber')
    expect(seniority).not.toHaveProperty('computeQualSnapshots')
    expect(seniority).not.toHaveProperty('applyProjectionToSnapshots')
    expect(seniority).not.toHaveProperty('memoizeLast')
    expect(seniority).not.toHaveProperty('qualificationKey')
  })
})
