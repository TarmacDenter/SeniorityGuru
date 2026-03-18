<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Upload Seniority List" />
    </template>

    <template #body>
      <div class="max-w-5xl mx-auto p-4 sm:p-6">
        <UStepper
          v-model="currentStep"
          :items="steps"
          disabled
          class="w-full mb-8"
        >
          <template #content>
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
              <div class="flex items-center justify-between">
                <p class="text-sm text-muted">
                  {{ upload.entries.value.length }} rows
                  <template v-if="upload.errorCount.value > 0">
                    &middot;
                    <UButton
                      variant="link"
                      color="error"
                      size="xs"
                      :icon="showErrorsOnly ? 'i-lucide-filter-x' : 'i-lucide-filter'"
                      @click="showErrorsOnly = !showErrorsOnly"
                    >
                      {{ upload.errorCount.value }} errors{{ showErrorsOnly ? ' (filtered)' : '' }}
                    </UButton>
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
          </template>
        </UStepper>

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
            Save
          </UButton>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import type { DateValue } from '@internationalized/date'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const upload = useSeniorityUpload()
const toast = useToast()
const files = ref<File | null>(null)
const showErrorsOnly = ref(false)

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
    return m.seniority_number >= 0 && m.employee_number >= 0 && m.seat >= 0 && m.base >= 0 && m.fleet >= 0 && m.hire_date >= 0
  }
  if (currentStep.value === 'review') return upload.errorCount.value === 0 && upload.entries.value.length > 0
  return true
})

async function nextStep() {
  if (currentStep.value === 'mapping') {
    processing.value = true
    // Yield to let the UI update with the loading state before heavy work
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
  const prevIdx = currentStepIndex.value - 1
  if (prevIdx >= 0) {
    currentStep.value = stepOrder[prevIdx]!
  }
}

defineExpose({ onSave })

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
