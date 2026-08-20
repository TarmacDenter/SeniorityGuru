// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry } from '~/test-utils/factories'
import { parsePlainDate } from '~/utils/temporal'
import { applyProjectionToSnapshots, computeQualSnapshots } from './qualification-position'

describe('qualification position', () => {
  it('keeps projected holdability state in qualification scales', () => {
    const asOfDate = parsePlainDate('2026-01-01')
    const entries = [makeDomainEntry({ seniority_number: 1 }), makeDomainEntry({ seniority_number: 2 })]
    const scales = applyProjectionToSnapshots(computeQualSnapshots(entries, asOfDate), entries, 1, asOfDate, undefined, asOfDate)
    expect(scales[0]).toMatchObject({ plugSenNum: 2, isHoldable: true })
  })
})
