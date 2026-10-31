<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui'
import type { ColumnMap } from '~/utils/parse-spreadsheet'
import type { UploadColumnMap, UploadMappingOptions } from '~/composables/seniority/upload/types'

const props = defineProps<{
  headers: string[]
  columnIds: string[]
  columnMap: UploadColumnMap
  mappingOptions: UploadMappingOptions
  sampleRows: string[][]
  sourceHeaders?: string[]
  columnSources?: Record<string, { header: string, kind: 'straight' | 'derived' }>
  suggestedColumnIds?: Partial<Record<keyof ColumnMap, string>>
}>()

const emit = defineEmits<{
  'update:columnMap': [map: UploadColumnMap]
  'update:mappingOptions': [options: UploadMappingOptions]
}>()

const requiredFields: { key: keyof ColumnMap; label: string }[] = [
  { key: 'seniority_number', label: 'Seniority Number' },
  { key: 'employee_number', label: 'Employee Number' },
  { key: 'seat', label: 'Seat / Position' },
  { key: 'base', label: 'Base / Domicile' },
  { key: 'fleet', label: 'Fleet / Aircraft' },
]

const columnLabels = computed(() => {
  const labels = props.headers.map((header, index) => {
    const source = props.columnSources?.[props.columnIds[index] ?? '']
    const own = header || `Column ${index + 1}`
    if (source?.kind === 'derived') return source.header ? `${own} (derived from ${source.header})` : own
    return source?.header || own
  })
  return labels.map((label, index) => labels.filter(other => other === label).length > 1 ? `${label} (column ${index + 1})` : label)
})

type ColumnOption = { label: string, value: string }

function optionsFor(field?: keyof ColumnMap): SelectMenuItem[][] {
  const suggested = field ? props.suggestedColumnIds?.[field] : undefined
  const auto: ColumnOption[] = []
  const other: ColumnOption[] = []
  props.columnIds.forEach((value, index) => {
    const label = columnLabels.value[index] ?? `Column ${index + 1}`
    if (value === suggested) {
      const derived = props.columnSources?.[value]?.kind === 'derived'
      auto.push({ label: derived ? label : `${label} (auto-detected)`, value })
    }
    else other.push({ label, value })
  })
  return [
    ...(auto.length ? [[{ type: 'label' as const, label: 'Auto-detected' }, ...auto]] : []),
    ...(other.length ? [[{ type: 'label' as const, label: 'Other columns' }, ...other]] : []),
  ]
}

function sampleValue(field: keyof ColumnMap): string | undefined {
  const columnId = props.columnMap[field]
  const idx = columnId ? props.columnIds.indexOf(columnId) : -1
  if (idx < 0 || !props.sampleRows[0]) return undefined
  return props.sampleRows[0][idx]
}

function updateOption<K extends keyof UploadMappingOptions>(key: K, value: UploadMappingOptions[K]) {
  emit('update:mappingOptions', { ...props.mappingOptions, [key]: value })
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="sourceHeaders?.length" class="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <p class="font-medium">Suggested columns</p>
        <p class="text-muted">Prepared labels used for mapping.</p>
        <p class="mt-1 text-xs">{{ headers.filter(Boolean).join(' · ') }}</p>
      </div>
      <div>
        <p class="font-medium">Original source columns</p>
        <p class="text-muted">Labels decoded from the unchanged worksheet.</p>
        <p class="mt-1 text-xs">{{ sourceHeaders.filter(Boolean).join(' · ') }}</p>
      </div>
    </div>
    <!-- Required field mappings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField v-for="field in requiredFields" :key="field.key" :label="field.label" required>
        <USelectMenu
          :model-value="columnMap[field.key] ?? undefined"
          :items="optionsFor(field.key)"
          value-key="value"
          placeholder="Select column..."
          class="w-full"
          @update:model-value="emit('update:columnMap', { ...columnMap, [field.key]: $event })"
        />
        <template #hint>
          <span v-if="sampleValue(field.key)" class="text-xs text-muted truncate">
            e.g. {{ sampleValue(field.key) }}
          </span>
        </template>
      </UFormField>
    </div>

    <USeparator />

    <!-- Name handling -->
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">Name columns</span>
        <AppButtonToggle
          :model-value="mappingOptions.nameMode ?? 'single'"
          :options="[
            { label: 'Single column', value: 'single' },
            { label: 'First & Last', value: 'separate' },
          ]"
          @update:model-value="updateOption('nameMode', $event as 'single' | 'separate')"
        />
      </div>

      <div v-if="mappingOptions.nameMode === 'single'" class="max-w-sm">
        <UFormField label="Name column">
          <USelectMenu
            :model-value="columnMap.name ?? undefined"
            :items="optionsFor('name')"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="emit('update:columnMap', { ...columnMap, name: $event ?? null })"
          />
        </UFormField>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <UFormField label="Last name column">
          <USelectMenu
            :model-value="mappingOptions.lastNameCol ?? undefined"
            :items="optionsFor()"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="updateOption('lastNameCol', $event ?? null)"
          />
        </UFormField>
        <UFormField label="First name column">
          <USelectMenu
            :model-value="mappingOptions.firstNameCol ?? undefined"
            :items="optionsFor()"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="updateOption('firstNameCol', $event ?? null)"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Retirement handling -->
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">Retirement date <span class="text-error">*</span></span>
        <AppButtonToggle
          :model-value="mappingOptions.retireMode ?? 'direct'"
          :options="[
            { label: 'Date column', value: 'direct' },
            { label: 'From DOB', value: 'dob' },
          ]"
          @update:model-value="updateOption('retireMode', $event as 'direct' | 'dob')"
        />
      </div>

      <div v-if="mappingOptions.retireMode === 'direct'" class="max-w-sm">
        <UFormField label="Retirement date column" required>
          <USelectMenu
            :model-value="columnMap.retire_date ?? undefined"
            :items="optionsFor('retire_date')"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="emit('update:columnMap', { ...columnMap, retire_date: $event ?? null })"
          />
        </UFormField>
      </div>

      <div v-else class="max-w-sm">
        <UFormField label="Date of birth column" required>
          <USelectMenu
            :model-value="mappingOptions.dobCol ?? undefined"
            :items="optionsFor()"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="updateOption('dobCol', $event ?? null)"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Hire date (required) -->
    <div class="max-w-sm">
      <UFormField label="Hire date column" required>
        <USelectMenu
          :model-value="columnMap.hire_date ?? undefined"
          :items="optionsFor('hire_date')"
          value-key="value"
          placeholder="Select column..."
          class="w-full"
          @update:model-value="emit('update:columnMap', { ...columnMap, hire_date: $event ?? null })"
        />
        <template #hint>
          <span v-if="sampleValue('hire_date')" class="text-xs text-muted truncate">
            e.g. {{ sampleValue('hire_date') }}
          </span>
        </template>
      </UFormField>
    </div>
  </div>
</template>
