import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { Qualification } from './types'

export function qualificationKey(value: Pick<SeniorityEntry, 'base' | 'seat' | 'fleet'> | Qualification): string {
  return `${value.base}|${value.seat}|${value.fleet}`
}
