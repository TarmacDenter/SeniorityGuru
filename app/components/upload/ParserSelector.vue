<script setup lang="ts">
import type { PreParser } from '~/utils/parsers/types'

const props = defineProps<{
  parsers: readonly PreParser[]
}>()

const emit = defineEmits<{
  select: [parserId: string]
}>()

const config = useRuntimeConfig()
const feedbackEmail = config.public.feedbackEmail as string
const mailtoHref = `mailto:${feedbackEmail}?subject=${encodeURIComponent('SeniorityGuru: Airline Parser Request')}`

const infoParser = ref<PreParser | null>(null)
const showInfoModal = ref(false)

function openInfo(parser: PreParser) {
  infoParser.value = parser
  showInfoModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <h2 class="text-xl font-semibold">Select Your File Format</h2>
      <p class="text-sm text-muted">
        Choose the format that matches your seniority list export.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
      <UCard
        v-for="parser in props.parsers"
        :key="parser.id"
        class="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        @click="emit('select', parser.id)"
      >
        <div class="flex flex-col items-center text-center gap-3 py-2">
          <UIcon :name="parser.icon" class="text-3xl text-primary" />
          <div>
            <p class="font-semibold">{{ parser.label }}</p>
            <p class="text-sm text-muted mt-1">{{ parser.description }}</p>
          </div>
          <UButton
            variant="link"
            size="xs"
            color="neutral"
            label="Learn More"
            @click.stop="openInfo(parser)"
          />
        </div>
      </UCard>
    </div>

    <div class="text-center pt-2">
      <UButton
        :to="mailtoHref"
        variant="ghost"
        color="neutral"
        icon="i-lucide-mail"
        size="sm"
        label="Don't see your airline?"
      />
    </div>

    <UModal v-model:open="showInfoModal" :title="infoParser?.label ?? 'Format Details'">
      <template #body>
        <p class="text-sm text-muted whitespace-pre-line">
          {{ infoParser?.formatDescription }}
        </p>
      </template>
    </UModal>
  </div>
</template>
