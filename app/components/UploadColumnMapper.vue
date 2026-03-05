<template>
  <div class="space-y-6">
    <!-- Required field mappings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField v-for="field in requiredFields" :key="field.key" :label="field.label" required>
        <USelectMenu
          :model-value="columnMap[field.key] >= 0 ? columnMap[field.key] : undefined"
          :items="columnOptions"
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
        <div class="inline-flex">
          <UButton
            size="xs"
            :variant="mappingOptions.nameMode === 'single' ? 'solid' : 'ghost'"
            class="rounded-r-none"
            @click="updateOption('nameMode', 'single')"
          >
            Single column
          </UButton>
          <UButton
            size="xs"
            :variant="mappingOptions.nameMode === 'separate' ? 'solid' : 'ghost'"
            class="rounded-l-none"
            @click="updateOption('nameMode', 'separate')"
          >
            First & Last
          </UButton>
        </div>
      </div>

      <div v-if="mappingOptions.nameMode === 'single'" class="max-w-sm">
        <UFormField label="Name column">
          <USelectMenu
            :model-value="columnMap.name >= 0 ? columnMap.name : undefined"
            :items="columnOptions"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="emit('update:columnMap', { ...columnMap, name: $event ?? -1 })"
          />
        </UFormField>
      </div>

      <div v-else class="grid grid-cols-2 gap-4 max-w-lg">
        <UFormField label="Last name column">
          <USelectMenu
            :model-value="mappingOptions.lastNameCol != null && mappingOptions.lastNameCol >= 0 ? mappingOptions.lastNameCol : undefined"
            :items="columnOptions"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="updateOption('lastNameCol', $event ?? -1)"
          />
        </UFormField>
        <UFormField label="First name column">
          <USelectMenu
            :model-value="mappingOptions.firstNameCol != null && mappingOptions.firstNameCol >= 0 ? mappingOptions.firstNameCol : undefined"
            :items="columnOptions"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="updateOption('firstNameCol', $event ?? -1)"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Retirement handling -->
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">Retirement date</span>
        <div class="inline-flex">
          <UButton
            size="xs"
            :variant="mappingOptions.retireMode === 'direct' ? 'solid' : 'ghost'"
            class="rounded-r-none"
            @click="updateOption('retireMode', 'direct')"
          >
            Date column
          </UButton>
          <UButton
            size="xs"
            :variant="mappingOptions.retireMode === 'dob' ? 'solid' : 'ghost'"
            class="rounded-l-none"
            @click="updateOption('retireMode', 'dob')"
          >
            From DOB
          </UButton>
        </div>
      </div>

      <div v-if="mappingOptions.retireMode === 'direct'" class="max-w-sm">
        <UFormField label="Retirement date column">
          <USelectMenu
            :model-value="columnMap.retire_date >= 0 ? columnMap.retire_date : undefined"
            :items="columnOptions"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="emit('update:columnMap', { ...columnMap, retire_date: $event ?? -1 })"
          />
        </UFormField>
      </div>

      <div v-else class="max-w-sm">
        <UFormField label="Date of birth column">
          <USelectMenu
            :model-value="mappingOptions.dobCol != null && mappingOptions.dobCol >= 0 ? mappingOptions.dobCol : undefined"
            :items="columnOptions"
            value-key="value"
            placeholder="Not mapped"
            class="w-full"
            @update:model-value="updateOption('dobCol', $event ?? -1)"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Hire date (required) -->
    <div class="max-w-sm">
      <UFormField label="Hire date column" required>
        <USelectMenu
          :model-value="columnMap.hire_date >= 0 ? columnMap.hire_date : undefined"
          :items="columnOptions"
          value-key="value"
          placeholder="Select column..."
          class="w-full"
          @update:model-value="emit('update:columnMap', { ...columnMap, hire_date: $event })"
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

<script setup lang="ts">
import type { ColumnMap, MappingOptions } from '~/utils/parse-spreadsheet'

const props = defineProps<{
  headers: string[]
  columnMap: ColumnMap
  mappingOptions: MappingOptions
  sampleRows: string[][]
}>()

const emit = defineEmits<{
  'update:columnMap': [map: ColumnMap]
  'update:mappingOptions': [options: MappingOptions]
}>()

const requiredFields: { key: keyof ColumnMap; label: string }[] = [
  { key: 'seniority_number', label: 'Seniority Number' },
  { key: 'employee_number', label: 'Employee Number' },
  { key: 'seat', label: 'Seat / Position' },
  { key: 'base', label: 'Base / Domicile' },
  { key: 'fleet', label: 'Fleet / Aircraft' },
]

const columnOptions = computed(() =>
  props.headers.map((h, i) => ({ label: h || `Column ${i + 1}`, value: i }))
)

function sampleValue(field: keyof ColumnMap): string | undefined {
  const idx = props.columnMap[field]
  if (idx < 0 || !props.sampleRows[0]) return undefined
  return props.sampleRows[0][idx]
}

function updateOption<K extends keyof MappingOptions>(key: K, value: MappingOptions[K]) {
  emit('update:mappingOptions', { ...props.mappingOptions, [key]: value })
}
</script>
