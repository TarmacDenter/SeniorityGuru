<script setup lang="ts">
import { useNewHireMode } from '~/composables/useNewHireMode'

const newHireMode = useNewHireMode()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">New Hire Mode</h2>
          <p class="text-sm text-muted mt-0.5">Preview your projected seniority as a new hire.</p>
        </div>
        <USwitch v-model="newHireMode.enabled.value" :disabled="newHireMode.realUserFound.value" />
      </div>
    </template>

    <div v-if="newHireMode.realUserFound.value && !newHireMode.enabled.value" class="text-sm text-muted">
      Your employee number was found in the seniority list. New Hire Mode is only available when you are not on the list.
    </div>

    <div v-else-if="newHireMode.enabled.value" class="space-y-4">
      <UAlert
        v-if="!newHireMode.isConfigured.value"
        icon="i-lucide-info"
        color="warning"
        variant="subtle"
        title="Configuration required"
        description="Set your base, seat, fleet, and birth date to activate new hire projections."
      />

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Base" name="base">
          <USelectMenu
            v-model="newHireMode.selectedBase.value"
            :items="newHireMode.availableBases.value"
            placeholder="Select base..."
            class="w-full"
            :search-input="false"
            clear
          />
        </UFormField>

        <UFormField label="Seat" name="seat">
          <USelectMenu
            v-model="newHireMode.selectedSeat.value"
            :items="newHireMode.availableSeats.value"
            placeholder="Select seat..."
            class="w-full"
            :search-input="false"
            clear
          />
        </UFormField>

        <UFormField label="Fleet" name="fleet">
          <USelectMenu
            v-model="newHireMode.selectedFleet.value"
            :items="newHireMode.availableFleets.value"
            placeholder="Select fleet..."
            class="w-full"
            :search-input="false"
            clear
          />
        </UFormField>

        <UFormField label="Birth Date" name="birthDate" :hint="newHireMode.retireDate.value ? `Retires ${newHireMode.retireDate.value}` : undefined">
          <UInput
            :model-value="newHireMode.birthDate.value ?? undefined"
            type="date"
            class="w-full"
            @update:model-value="newHireMode.birthDate.value = $event || null"
          />
        </UFormField>
      </div>

      <div class="flex justify-end pt-2 border-t border-default">
        <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="newHireMode.reset()">
          Clear and disable
        </UButton>
      </div>
    </div>

    <p v-else class="text-sm text-muted">
      Enable to simulate your standing as a new hire at the bottom of the seniority list.
    </p>
  </UCard>
</template>
