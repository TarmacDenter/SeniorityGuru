import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import type { AnchoredSeniorityAnalysis, SeniorityAnalysis } from '~/utils/seniority'
import { createSeniorityAnalysis } from '~/utils/seniority'
import { computeComparison } from '~/utils/seniority-compare'
import { buildDiffRows, type DiffRow } from '~/utils/build-diff-rows'
import { localEntryToSeniorityEntry } from '~/utils/db-adapters'
import { todayPlainDate, type PlainDate } from '~/utils/temporal'
import { provideSeniorityCore, type NewHireControls } from '~/composables/seniority/modules/useSeniorityCore'

/** Effective date of the current demo list (see app/hooks/demo-enter.ts). */
const CURRENT_EFFECTIVE_DATE = '2025-04-01'

/** New Hire Mode is not offered on the landing page: every control is disabled and inert. */
function inertNewHire(): NewHireControls {
  return {
    enabled: ref(false),
    selectedBase: ref(null),
    selectedSeat: ref(null),
    selectedFleet: ref(null),
    birthDate: shallowRef(null),
    availableBases: computed(() => []),
    availableSeats: computed(() => []),
    availableFleets: computed(() => []),
    realUserFound: computed(() => false),
    isConfigured: computed(() => false),
    retireDate: computed(() => null),
    syntheticEntry: computed(() => null),
    reset() {},
  }
}

/**
 * Builds the demo lists in memory and provides them as the seniority core for every descendant,
 * so the dashboard composables render the landing page's figures. Touches no store and no Dexie.
 * Call from a component's setup; children resolve the core through `useSeniorityCore()`.
 */
export function useLandingShowcase() {
  const ready = ref(false)
  const error = ref<string | null>(null)
  const diffRows = shallowRef<DiffRow[]>([])

  const entries = shallowRef<SeniorityEntry[]>([])
  const employeeNumber = shallowRef<string | null>(null)

  const listAnalysis = computed<SeniorityAnalysis | null>(() =>
    entries.value.length === 0 ? null : createSeniorityAnalysis({ entries: entries.value, asOfDate: todayPlainDate() }),
  )
  const anchoredAnalysis = computed<AnchoredSeniorityAnalysis | null>(() =>
    employeeNumber.value && listAnalysis.value ? listAnalysis.value.withAnchor(employeeNumber.value) : null,
  )
  const userEntry = computed<SeniorityEntry | undefined>(() => anchoredAnalysis.value?.anchor)
  const projectionEndDate = computed<PlainDate | null>(() =>
    userEntry.value?.retire_date ?? listAnalysis.value?.catalog.latestRetirementDate ?? null,
  )

  provideSeniorityCore({
    listAnalysis,
    analysis: listAnalysis,
    anchoredAnalysis,
    userEntry,
    entries: computed(() => entries.value),
    projectionEndDate,
    hasData: computed(() => listAnalysis.value !== null),
    hasAnchor: computed(() => anchoredAnalysis.value !== null),
    isNewHireMode: computed(() => false),
    newHire: inertNewHire(),
    stateKey: 'landing:',
  })

  async function load() {
    try {
      const [assets, parser] = await Promise.all([import('~/utils/demo-assets'), import('~/utils/demo-parser')])
      const toEntries = (csv: string) => parser.parseDemoCSV(csv).map(e => localEntryToSeniorityEntry({ ...e, listId: 0 }))
      const base = toEntries(assets.demoDataCSV)
      const current = toEntries(assets.demoDataV2CSV)
      diffRows.value = buildDiffRows(computeComparison(base, current, CURRENT_EFFECTIVE_DATE), { includeSeniorityNumberChanges: true })
      employeeNumber.value = parser.DEMO_EMPLOYEE_NUMBER
      entries.value = current
      ready.value = true
    }
    catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load the demo lists'
    }
  }

  if (import.meta.client) void load()

  return { ready, error, diffRows }
}
