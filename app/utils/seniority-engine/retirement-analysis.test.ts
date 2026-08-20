// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { computeRetirementWave } from './retirement-analysis'

describe('computeRetirementWave', () => {
  it('groups years in ascending order and identifies waves', () => {
    const entries = [
      makeDomainEntry({ retire_date: '2028-01-01' }), makeDomainEntry({ retire_date: '2029-01-01' }),
      ...Array.from({ length: 6 }, (_, index) => makeDomainEntry({ retire_date: `2030-0${(index % 6) + 1}-01` })),
    ]
    expect(computeRetirementWave(entries)).toEqual([
      { year: 2028, count: 1, isWave: false }, { year: 2029, count: 1, isWave: false }, { year: 2030, count: 6, isWave: true },
    ])
  })

  it('returns an empty result when no retirement date is available', () => {
    expect(computeRetirementWave([makeDomainEntry({ retire_date: null })])).toEqual([])
  })

  it('restricts waves with the supplied qualification filter', () => {
    const entries = [
      makeDomainEntry({ fleet: '737', retire_date: '2028-01-01' }),
      makeDomainEntry({ fleet: '320', retire_date: '2029-01-01' }),
    ]
    expect(computeRetirementWave(entries, entry => entry.fleet === '737')).toEqual([
      { year: 2028, count: 1, isWave: false },
    ])
  })
})
