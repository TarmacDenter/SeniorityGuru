import type { SeniorityEntry } from '#shared/schemas/seniority-list'
import { enumerateQualSpecs, qualSpecLabel } from '#shared/utils/seniority-engine'
import type { QualSpec } from '#shared/utils/seniority-engine'

export function useScopeFilter(entries: Ref<readonly SeniorityEntry[]> | ComputedRef<readonly SeniorityEntry[]>) {
  const specs = computed(() => enumerateQualSpecs(entries.value))

  const scopeOptions = computed(() => specs.value.map(qualSpecLabel))

  const labelToSpec = computed(() => {
    const map = new Map<string, QualSpec>()
    for (const spec of specs.value) {
      map.set(qualSpecLabel(spec), spec)
    }
    return map
  })

  function specForLabel(label: string): QualSpec {
    return labelToSpec.value.get(label) ?? {}
  }

  return { scopeOptions, specForLabel }
}
