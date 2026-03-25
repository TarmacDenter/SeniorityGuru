<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import type { DateValue } from '@internationalized/date'
import { useSeniorityUpload } from '~/composables/seniority'
import { parsers } from '~/utils/parsers/registry'

definePageMeta({ layout: 'dashboard' })

defineExpose({ onSave })

const upload = useSeniorityUpload()
const toast = useToast()
const files = ref<File | null>(null)
const showErrorsOnly = ref(false)
const mappingSkipped = ref(false)

const stepOrder = ['upload', 'mapping', 'review', 'confirm'] as const
type Step = typeof stepOrder[number]
const steps: StepperItem[] = [
  { title: 'Upload', description: 'Choose file', icon: 'i-lucide-upload', value: 'upload' },
  { title: 'Map Columns', description: 'Match fields', icon: 'i-lucide-columns-3', value: 'mapping' },
  { title: 'Review', description: 'Validate data', icon: 'i-lucide-scan-eye', value: 'review' },
  { title: 'Save', description: 'Confirm & upload', icon: 'i-lucide-check-circle', value: 'confirm' },
]

const currentStep = ref<Step | number>('upload')
const processing = ref(false)
watch(files, async (next) => {
  if (!next) {
    currentStep.value = 'upload'
    await upload.setFiles([])
    return
  }
  currentStep.value = 'upload'
  await upload.setFiles([next])
})

const currentStepIndex = computed(() => stepOrder.indexOf(currentStep.value as Step))
const sampleRows = computed(() => upload.rawRows.value.slice(0, 3))
const effectiveDateModel = computed({
  get: () => (upload.effectiveDate.value ?? undefined) as DateValue | undefined,
  set: (value: DateValue | undefined) => {
    upload.effectiveDate.value = value ?? null
  },
})

const canAdvance = computed(() => {
  if (currentStep.value === 'upload') return upload.rawRows.value.length > 0
  if (currentStep.value === 'mapping') {
    const m = upload.columnMap.value
    const dobDerivationModeActive = upload.mappingOptions.value.retireMode === 'dob'
    const retireDateSatisfied = m.retire_date >= 0 || dobDerivationModeActive
    return m.seniority_number >= 0 && m.employee_number >= 0 && m.seat >= 0 && m.base >= 0 && m.fleet >= 0 && m.hire_date >= 0 && retireDateSatisfied
  }
  if (currentStep.value === 'review') return upload.errorCount.value === 0 && upload.entries.value.length > 0
  return true
})

function selectParser(parserId: string) {
  upload.selectedParserId.value = parserId
}

function changeFormat() {
  upload.reset()
  files.value = null
  mappingSkipped.value = false
}

async function nextStep() {
  if (currentStep.value === 'upload' && upload.autoDetectSucceeded.value) {
    processing.value = true
    await new Promise(resolve => setTimeout(resolve, 0))
    upload.applyMapping()
    processing.value = false
    mappingSkipped.value = true
    currentStep.value = 'review'
    toast.add({ title: 'All columns auto-detected — skipped to review', color: 'info' })
    return
  }
  if (currentStep.value === 'mapping') {
    processing.value = true
    await new Promise(resolve => setTimeout(resolve, 0))
    upload.applyMapping()
    processing.value = false
  }
  const nextIdx = currentStepIndex.value + 1
  if (nextIdx < stepOrder.length) {
    currentStep.value = stepOrder[nextIdx]!
  }
}

function prevStep() {
  if (currentStep.value === 'review' && mappingSkipped.value) {
    mappingSkipped.value = false
    currentStep.value = 'upload'
    return
  }
  const prevIdx = currentStepIndex.value - 1
  if (prevIdx >= 0) {
    currentStep.value = stepOrder[prevIdx]!
  }
}

function onDeleteErrorRows() {
  const count = upload.deleteErrorRows()
  if (count > 0) {
    toast.add({ title: `Removed ${count} malformed row${count === 1 ? '' : 's'}`, color: 'success' })
  }
}

async function onSave() {
  try {
    const count = await upload.save()
    toast.add({ title: `Uploaded ${count} entries`, color: 'success' })
    upload.reset()
    await navigateTo({ path: '/dashboard', query: { tab: 'seniority' } })
  } catch {
    toast.add({ title: upload.saveError.value ?? 'Upload failed', color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Upload Seniority List" />
    </template>

    <template #body>
      <div class="max-w-5xl mx-auto p-4 sm:p-6">
        <!-- State 1: Parser Selection (before wizard) -->
        <template v-if="!upload.selectedParserId.value">
          <ParserSelector :parsers="parsers" @select="selectParser" />
        </template>

        <!-- State 2: Upload Wizard (after parser selected) -->
        <template v-else>
          <!-- Change format link -->
          <div class="mb-4">
            <UButton
              variant="link"
              color="neutral"
              icon="i-lucide-arrow-left"
              size="sm"
              label="Change format"
              @click="changeFormat"
            />
          </div>

          <!-- Mobile: compact step indicator -->
          <div class="sm:hidden text-sm text-muted text-center mb-6">
            Step {{ currentStepIndex + 1 }} of {{ steps.length }}
            <span class="mx-2">&middot;</span>
            <span class="font-medium text-(--ui-text)">{{ steps[currentStepIndex]?.title }}</span>
          </div>

          <!-- Desktop: full stepper (indicator only — content rendered below) -->
          <UStepper
            v-model="currentStep"
            :items="steps"
            disabled
            class="hidden sm:flex w-full mb-8"
          />

          <!-- Step content (always rendered, shared by mobile and desktop) -->
          <div class="mb-6">
            <!-- Step 1: Upload File -->
            <div v-if="currentStep === 'upload'" class="space-y-6">
              <UFileUpload
                v-model="files"
                accept=".csv,.xlsx,.xls"
                variant="area"
                icon="i-lucide-upload"
                label="Drag & drop your CSV or XLSX file here"
                description="or tap to choose a file"
              />

              <UButton
                v-if="files"
                variant="ghost"
                color="neutral"
                icon="i-lucide-x"
                class="mt-2"
                @click="files = null"
              >
                Clear file
              </UButton>

              <UAlert
                v-if="upload.fileName.value"
                icon="i-lucide-file-check"
                color="success"
                variant="soft"
                :title="`Loaded: ${upload.fileName.value}`"
                :description="`${upload.rawRows.value.length} rows, ${upload.rawHeaders.value.length} columns`"
              />
            </div>

            <!-- Step 2: Map Columns -->
            <div v-else-if="currentStep === 'mapping'" class="space-y-6">
              <UploadColumnMapper
                :headers="upload.rawHeaders.value"
                :column-map="upload.columnMap.value"
                :mapping-options="upload.mappingOptions.value"
                :sample-rows="sampleRows"
                @update:column-map="upload.columnMap.value = $event"
                @update:mapping-options="upload.mappingOptions.value = $event"
              />
            </div>

            <!-- Step 3: Review & Validate -->
            <div v-else-if="currentStep === 'review'" class="space-y-4">
              <UAlert
                v-if="upload.errorCount.value > 0"
                icon="i-lucide-alert-triangle"
                color="warning"
                variant="subtle"
                :title="`${upload.errorCount.value} row${upload.errorCount.value === 1 ? '' : 's'} could not be parsed`"
                description="These rows have missing or malformed data and must be fixed or removed before saving."
              >
                <template #actions>
                  <UButton
                    size="sm"
                    color="warning"
                    icon="i-lucide-trash-2"
                    @click="onDeleteErrorRows"
                  >
                    Remove {{ upload.errorCount.value }} malformed row{{ upload.errorCount.value === 1 ? '' : 's' }}
                  </UButton>
                  <UButton
                    size="sm"
                    variant="ghost"
                    color="neutral"
                    :icon="showErrorsOnly ? 'i-lucide-filter-x' : 'i-lucide-filter'"
                    @click="showErrorsOnly = !showErrorsOnly"
                  >
                    {{ showErrorsOnly ? 'Show all rows' : 'Show only errors' }}
                  </UButton>
                </template>
              </UAlert>

              <div class="flex items-center justify-between">
                <p class="text-sm text-muted">
                  {{ upload.entries.value.length }} rows
                  <template v-if="upload.errorCount.value > 0">
                    &middot;
                    <span class="text-warning">{{ upload.errorCount.value }} with errors</span>
                  </template>
                </p>
              </div>
              <UploadReviewTable
                :entries="upload.entries.value"
                :row-errors="upload.rowErrors.value"
                :show-errors-only="showErrorsOnly"
                @update-cell="upload.updateCell"
                @delete-row="upload.deleteRow"
              />
            </div>

            <!-- Step 4: Confirm & Save -->
            <div v-else-if="currentStep === 'confirm'" class="space-y-6 max-w-md">
              <UFormField label="Effective Date" name="effectiveDate" required>
                <UInputDate v-model="effectiveDateModel" class="w-full" />
              </UFormField>

              <UFormField label="Title (optional)" name="title">
                <UInput v-model="upload.title.value" placeholder="e.g. January 2026 Seniority List" class="w-full" />
              </UFormField>

              <div class="bg-elevated rounded-lg p-4 space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Rows</span>
                  <span class="font-medium">{{ upload.entries.value.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">File</span>
                  <span class="font-medium">{{ upload.fileName.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation buttons -->
          <div class="flex justify-between mt-6">
            <UButton
              v-if="currentStep !== 'upload'"
              variant="ghost"
              icon="i-lucide-arrow-left"
              @click="prevStep"
            >
              Back
            </UButton>
            <div v-else />

            <UButton
              v-if="currentStep !== 'confirm'"
              :disabled="!canAdvance || processing"
              :loading="processing"
              icon="i-lucide-arrow-right"
              trailing
              @click="nextStep"
            >
              Next
            </UButton>
            <UButton
              v-else
              :disabled="!upload.effectiveDate.value || upload.saving.value"
              :loading="upload.saving.value"
              icon="i-lucide-check"
              color="success"
              @click="onSave"
            >
              Looks Good
            </UButton>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
