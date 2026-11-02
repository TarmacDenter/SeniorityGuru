import { DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, formatGrowthAssumptions, type GrowthAssumptions, type QualificationScope } from '~/utils/seniority'
import { useSeniorityCore } from '~/composables/seniority'
import { formatDate, todayISO } from '~/utils/date'
import { useScopeFilter } from '~/composables/useScopeFilter'

const COMPANY_WIDE = 'Company-wide'

/**
 * The Scenario shared by Now, Next and Qualifications: Qualification Scope and Growth Assumptions.
 * State is held once (useState) so the scenario strip and every panel read the same values.
 */
export function useScenario() {
  const { listAnalysis } = useSeniorityCore()
  const scopeLabel = useState<string>('scenarioScopeLabel', () => COMPANY_WIDE)
  const growthAssumptions = useState<GrowthAssumptions>('scenarioGrowthAssumptions', () => ({ ...DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS }))

  const scopeOptionList = computed(() => listAnalysis.value?.catalog.qualificationScopeOptions ?? [])
  const { scopeOptions: scopeLabels, specForLabel } = useScopeFilter(scopeOptionList)
  const qualificationScope = computed<QualificationScope>(() => specForLabel(scopeLabel.value))

  const growthLabel = computed(() => formatGrowthAssumptions(growthAssumptions.value))

  /** The As-of Date is today; it is read-only. */
  const asOfLabel = computed(() => formatDate(todayISO()))

  return { asOfLabel, scopeLabel, scopeLabels, qualificationScope, growthAssumptions, growthLabel }
}
