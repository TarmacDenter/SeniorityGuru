import type { SeniorityEntry } from '~/utils/schemas/seniority-list'
import { enumerateQualificationScopes, formatQualificationScope } from '~/utils/seniority'
import type { QualificationScope } from '~/utils/seniority'

export function useScopeFilter(entries: Ref<readonly SeniorityEntry[]> | ComputedRef<readonly SeniorityEntry[]>) {
  const specs = computed(() => enumerateQualificationScopes(entries.value))

  const scopeOptions = computed(() => specs.value.map(formatQualificationScope))

  const labelToSpec = computed(() => {
    const map = new Map<string, QualificationScope>()
    for (const spec of specs.value) {
      map.set(formatQualificationScope(spec), spec)
    }
    return map
  })

  function specForLabel(label: string): QualificationScope {
    return labelToSpec.value.get(label) ?? {}
  }

  return { scopeOptions, specForLabel }
}
