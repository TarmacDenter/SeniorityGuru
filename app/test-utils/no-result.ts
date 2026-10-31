import type { NoResult } from '~/utils/seniority-engine/types'
import { isNoResult } from '~/utils/seniority-engine/types'

/** Narrows an analysis result in tests, failing loudly when the Anchor Pilot has no result. */
export function resultOf<T>(value: T | NoResult): T {
  if (isNoResult(value)) throw new Error(`Expected a result but got no-result: ${value.label}`)
  return value
}
