<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import type { DateValue } from '@internationalized/date'
import { useSeniorityUpload } from '~/composables/seniority'
import { parsers } from '~/utils/parsers/registry'
import { createLogger } from '~/utils/logger'

const log = createLogger('upload-page')

definePageMeta({ layout: 'dashboard' })

defineExpose({ onSave })

const upload = useSeniorityUpload()
const toast = useToast()
const files = ref<File | null>(null)
const showErrorsOnly = ref(false)
const showEstimatedOnly = ref(false)
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
const currentStepIndex = computed(() => stepOrder.indexOf(currentStep.value as Step))

const phaseLabels: Record<string, string> = {
  reading: 'Reading file...',
  parsing: 'Parsing spreadsheet...',
  mapping: 'Mapping columns...',
  validating: 'Validating rows...',
}

watch(files, async (next) => {
  currentStep.value = 'upload'
  await upload.file.setFile(next ?? null)
})

const effectiveDateModel = computed({
  get: () => (upload.confirm.effectiveDate.value ?? undefined) as DateValue | undefined,
  set: (value: DateValue | undefined) => {
    upload.confirm.effectiveDate.value = value ?? null
  },
})

const canAdvance = computed(() => {
  if (currentStep.value === 'upload') return upload.file.hasData.value
  if (currentStep.value === 'mapping') return upload.mapping.canAdvance.value
  if (currentStep.value === 'review') return upload.review.canAdvance.value
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
  if (currentStep.value === 'upload' && upload.file.autoDetected.value) {
    try {
      await upload.mapping.apply()
    } catch {
      log.error('applyMapping failed during auto-detect step')
      toast.add({ title: 'Failed to process file', color: 'error' })
      return
    }
    mappingSkipped.value = true
    currentStep.value = 'review'
    log.info('Upload step advanced (mapping skipped)', { step: 'review' })
    toast.add({ title: 'All columns auto-detected — skipped to review', color: 'info' })
    return
  }
  if (currentStep.value === 'mapping') {
    try {
      await upload.mapping.apply()
    } catch {
      log.error('applyMapping failed during mapping step')
      toast.add({ title: 'Failed to process file', color: 'error' })
      return
    }
  }
  const nextIdx = currentStepIndex.value + 1
  if (nextIdx < stepOrder.length) {
    currentStep.value = stepOrder[nextIdx]!
    log.info('Upload step advanced', { step: currentStep.value })
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
  const count = upload.review.deleteErrorRows()
  if (count > 0) {
    toast.add({ title: `Removed ${count} malformed row${count === 1 ? '' : 's'}`, color: 'success' })
  }
}

async function onSave() {
  try {
    const count = await upload.confirm.save(upload.review.entries.value)
    toast.add({ title: `Uploaded ${count} entries`, color: 'success' })
    upload.reset()
    await navigateTo({ path: '/dashboard', query: { tab: 'seniority' } })
  } catch {
    toast.add({ title: upload.confirm.error.value ?? 'Upload failed', color: 'error' })
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

              <!-- Error alert for file/sheet issues -->
              <UAlert
                v-if="upload.file.error.value && currentStep === 'upload'"
                icon="i-lucide-alert-circle"
                color="error"
                variant="soft"
                :title="upload.file.error.value"
              >
                <template #actions>
                  <UButton
                    size="sm"
                    color="error"
                    icon="i-lucide-rotate-ccw"
                    @click="changeFormat"
                  >
                    Try Again
                  </UButton>
                </template>
              </UAlert>

              <!-- Sheet selector for multi-sheet XLSX files -->
              <div v-if="upload.file.sheetNames.value.length > 1" class="space-y-2">
                <UFormField label="Select Sheet" name="sheet">
                  <USelectMenu
                    :model-value="upload.file.selectedSheet.value ?? undefined"
                    :items="upload.file.sheetNames.value"
                    placeholder="Choose a sheet..."
                    :search-input="false"
                    class="w-full"
                    @update:model-value="upload.file.selectSheet"
                  />
                </UFormField>
              </div>

              <UAlert
                v-if="upload.file.fileName.value && upload.file.hasData.value"
                icon="i-lucide-file-check"
                color="success"
                variant="soft"
                :title="`Loaded: ${upload.file.fileName.value}${upload.file.selectedSheet.value ? ` — ${upload.file.selectedSheet.value}` : ''}`"
                :description="`${upload.mapping.headers.value.length} columns detected`"
              />
            </div>

            <!-- Step 2: Map Columns -->
            <div v-else-if="currentStep === 'mapping'" class="space-y-6">
              <UploadColumnMapper
                :headers="upload.mapping.headers.value"
                :column-map="upload.mapping.columnMap.value"
                :mapping-options="upload.mapping.mappingOptions.value"
                :sample-rows="upload.mapping.sampleRows.value"
                @update:column-map="upload.mapping.columnMap.value = $event"
                @update:mapping-options="upload.mapping.mappingOptions.value = $event"
              />
            </div>

            <!-- Step 3: Review & Validate -->
            <div v-else-if="currentStep === 'review'" class="space-y-4">
              <UAlert
                v-if="upload.review.syntheticNote.value"
                icon="i-lucide-info"
                color="info"
                variant="subtle"
                title="Some data was estimated"
                :description="upload.review.syntheticNote.value"
              >
                <template #actions>
                  <UButton
                    size="sm"
                    color="info"
                    :icon="showEstimatedOnly ? 'i-lucide-filter-x' : 'i-lucide-filter'"
                    @click="showEstimatedOnly = !showEstimatedOnly; showErrorsOnly = false"
                  >
                    {{ showEstimatedOnly ? 'Show all rows' : 'Show estimated rows' }}
                  </UButton>
                </template>
              </UAlert>

              <UAlert
                v-if="upload.review.errorCount.value > 0"
                icon="i-lucide-alert-triangle"
                color="warning"
                variant="subtle"
                :title="`${upload.review.errorCount.value} of ${upload.review.entries.value.length.toLocaleString()} rows have validation errors`"
                description="Fix or remove them to continue."
              >
                <template #actions>
                  <UButton
                    size="sm"
                    color="warning"
                    icon="i-lucide-trash-2"
                    @click="onDeleteErrorRows"
                  >
                    Remove {{ upload.review.errorCount.value }} malformed row{{ upload.review.errorCount.value === 1 ? '' : 's' }}
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
                  {{ upload.review.entries.value.length }} rows
                  <template v-if="upload.review.errorCount.value > 0">
                    &middot;
                    <span class="text-warning">{{ upload.review.errorCount.value }} with errors</span>
                  </template>
                </p>
              </div>
              <UploadReviewTable
                :entries="upload.review.entries.value"
                :row-errors="upload.review.rowErrors.value"
                :show-errors-only="showErrorsOnly"
                :show-estimated-only="showEstimatedOnly"
                :estimated-indices="upload.review.syntheticIndices.value"
                @update-cell="upload.review.updateCell"
                @delete-row="upload.review.deleteRow"
              />
            </div>

            <!-- Step 4: Confirm & Save -->
            <div v-else-if="currentStep === 'confirm'" class="space-y-6 max-w-md">
              <UFormField label="Effective Date" name="effectiveDate" required>
                <UInputDate v-model="effectiveDateModel" class="w-full" />
              </UFormField>

              <UFormField label="Title (optional)" name="title">
                <UInput v-model="upload.confirm.title.value" placeholder="e.g. January 2026 Seniority List" class="w-full" />
              </UFormField>

              <div class="bg-elevated rounded-lg p-4 space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Rows</span>
                  <span class="font-medium">{{ upload.review.entries.value.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">File</span>
                  <span class="font-medium">{{ upload.file.fileName.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Processing progress bar -->
          <div v-if="upload.progress.busy.value" class="space-y-2 mb-6">
            <p class="text-sm text-muted">{{ phaseLabels[upload.progress.phase.value] || 'Processing...' }}</p>
            <UProgress
              v-if="upload.progress.percent.value !== null"
              :model-value="upload.progress.percent.value"
              size="sm"
            />
            <UProgress
              v-else
              size="sm"
            />
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
              :disabled="!canAdvance || upload.progress.busy.value"
              :loading="upload.progress.busy.value"
              icon="i-lucide-arrow-right"
              trailing
              @click="nextStep"
            >
              Next
            </UButton>
            <UButton
              v-else
              :disabled="!upload.confirm.effectiveDate.value || upload.confirm.saving.value"
              :loading="upload.confirm.saving.value"
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
