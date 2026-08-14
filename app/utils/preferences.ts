import { z } from 'zod'

/** Stored shape of the new-hire configuration preference (key: 'growthConfig'). */
export interface NewHireConfig {
  birthDate: string | null
  selectedBase: string | null
  selectedSeat: string | null
  selectedFleet: string | null
}

export interface ImportMappingPreference {
  /** Prepared-column IDs where available, otherwise normalized source labels. */
  columns: Record<string, string>
  mappingOptions?: {
    nameMode?: 'single' | 'separate'
    firstNameCol?: string | null
    lastNameCol?: string | null
    retireMode?: 'direct' | 'dob'
    dobCol?: string | null
    retirementAge?: number
  }
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
  lastUploadType: string
  importMappings: Record<string, ImportMappingPreference>
}

const NewHireConfigSchema = z.object({
  birthDate: z.string().nullable(),
  selectedBase: z.string().nullable(),
  selectedSeat: z.string().nullable(),
  selectedFleet: z.string().nullable(),
})
const ImportMappingPreferenceSchema = z.object({
  columns: z.record(z.string(), z.string()),
  mappingOptions: z.object({
    nameMode: z.enum(['single', 'separate']).optional(),
    firstNameCol: z.string().nullable().optional(),
    lastNameCol: z.string().nullable().optional(),
    retireMode: z.enum(['direct', 'dob']).optional(),
    dobCol: z.string().nullable().optional(),
    retirementAge: z.number().optional(),
  }).optional(),
})
const ImportMappingsSchema = z.record(z.string(), ImportMappingPreferenceSchema)

/** Serializes a typed preference value to the string stored in Dexie. */
export const PREFERENCE_SERIALIZERS: { [K in keyof PreferenceMap]: (v: PreferenceMap[K]) => string } = {
  employeeNumber: (v) => v,
  retirementAge: (v) => String(v),
  newHireEnabled: (v) => String(v),
  growthConfig: (v) => JSON.stringify(v),
  'pwa-dismissed': (v) => String(v),
  'pwa-snoozed-until': (v) => v,
  demoBannerDismissed: (v) => String(v),
  lastUploadType: (v) => v,
  importMappings: (v) => JSON.stringify(v),
}

/** Deserializes a raw Dexie string back to the typed preference value. */
export const PREFERENCE_DESERIALIZERS: { [K in keyof PreferenceMap]: (raw: string) => PreferenceMap[K] } = {
  employeeNumber: (raw) => raw,
  retirementAge: (raw) => Number(raw),
  newHireEnabled: (raw) => raw === 'true',
  growthConfig: (raw) => NewHireConfigSchema.catch({ birthDate: null, selectedBase: null, selectedSeat: null, selectedFleet: null }).parse(JSON.parse(raw)),
  'pwa-dismissed': (raw) => raw === 'true',
  'pwa-snoozed-until': (raw) => raw,
  demoBannerDismissed: (raw) => raw === 'true',
  lastUploadType: (raw) => raw,
  importMappings: (raw) => ImportMappingsSchema.catch({}).parse(JSON.parse(raw)),
}
