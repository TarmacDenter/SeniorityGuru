// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { analyzeRetirementYears } from './retirement-analysis'

describe('analyzeRetirementYears', () => {
  it('groups retirement counts by year and preserves the Retirement Wave formula', () => {
    const entries = [
      makeDomainEntry({ retire_date: '2028-01-01' }), makeDomainEntry({ retire_date: '2029-01-01' }),
      ...Array.from({ length: 6 }, (_, index) => makeDomainEntry({ retire_date: `2030-0${(index % 6) + 1}-01` })),
    ]
    expect(analyzeRetirementYears(entries)).toEqual([
      { year: 2028, retirementCount: 1, isRetirementWave: false },
      { year: 2029, retirementCount: 1, isRetirementWave: false },
      { year: 2030, retirementCount: 6, isRetirementWave: true },
    ])
  })

  it('returns an empty result when no retirement date is available', () => {
    expect(analyzeRetirementYears([makeDomainEntry({ retire_date: undefined })])).toEqual([])
  })

  it('restricts waves with the supplied qualification filter', () => {
    const entries = [
      makeDomainEntry({ fleet: '737', retire_date: '2028-01-01' }),
      makeDomainEntry({ fleet: '320', retire_date: '2029-01-01' }),
    ]
    expect(analyzeRetirementYears(entries, entry => entry.fleet === '737')).toEqual([
      { year: 2028, retirementCount: 1, isRetirementWave: false },
    ])
  })
})
