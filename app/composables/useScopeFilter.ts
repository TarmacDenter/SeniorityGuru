import type { QualificationScope, SeniorityQualificationScopeOption } from '~/utils/seniority'

export function useScopeFilter(options: Ref<readonly SeniorityQualificationScopeOption[]> | ComputedRef<readonly SeniorityQualificationScopeOption[]>) {

  const scopeOptions = computed(() => options.value.map(option => option.label))

  const labelToSpec = computed(() => {
    const map = new Map<string, QualificationScope>()
    for (const option of options.value) {
      map.set(option.label, option.scope)
    }
    return map
  })

  function specForLabel(label: string): QualificationScope {
    return labelToSpec.value.get(label) ?? {}
  }

  return { scopeOptions, specForLabel }
}
