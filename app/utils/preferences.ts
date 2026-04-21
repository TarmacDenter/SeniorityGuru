import { canonicalizeEmployeeNumber } from './schemas/seniority-list'

/** Stored shape of the new-hire configuration preference (key: 'growthConfig'). */
export interface NewHireConfig {
  birthDate: string | null
  selectedBase: string | null
  selectedSeat: string | null
  selectedFleet: string | null
}

/** Maps every preference key to its strongly typed value. */
export interface PreferenceMap {
  employeeNumber: string
  retirementAge: number
  newHireEnabled: boolean
  growthConfig: NewHireConfig
  'pwa-dismissed': boolean
  'pwa-snoozed-until': string
  demoBannerDismissed: boolean
}

/** Serializes a typed preference value to the string stored in Dexie. */
export const PREFERENCE_SERIALIZERS: { [K in keyof PreferenceMap]: (v: PreferenceMap[K]) => string } = {
  employeeNumber: (v) => canonicalizeEmployeeNumber(v),
  retirementAge: (v) => String(v),
  newHireEnabled: (v) => String(v),
  growthConfig: (v) => JSON.stringify(v),
  'pwa-dismissed': (v) => String(v),
  'pwa-snoozed-until': (v) => v,
  demoBannerDismissed: (v) => String(v),
}

/** Deserializes a raw Dexie string back to the typed preference value. */
export const PREFERENCE_DESERIALIZERS: { [K in keyof PreferenceMap]: (raw: string) => PreferenceMap[K] } = {
  employeeNumber: (raw) => canonicalizeEmployeeNumber(raw),
  retirementAge: (raw) => Number(raw),
  newHireEnabled: (raw) => raw === 'true',
  growthConfig: (raw) => JSON.parse(raw) as NewHireConfig,
  'pwa-dismissed': (raw) => raw === 'true',
  'pwa-snoozed-until': (raw) => raw,
  demoBannerDismissed: (raw) => raw === 'true',
}
