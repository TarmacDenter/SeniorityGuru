<script setup lang="ts">
import { useNewHireMode } from '~/composables/useNewHireMode'
import { useUserStore } from '~/stores/user'

const newHireMode = useNewHireMode()
const userStore = useUserStore()
</script>

<template>
  <!-- Mode OFF: show "not found" / "no emp number" warning with toggle -->
  <UAlert
    v-if="!newHireMode.enabled.value"
    icon="i-lucide-alert-triangle"
    color="warning"
    variant="subtle"
    :title="userStore.profile?.employee_number ? 'Employee Number Not Found' : 'No Employee Number Set'"
    :description="userStore.profile?.employee_number
      ? `Employee number '${userStore.profile.employee_number}' was not found in the current seniority list.`
      : 'Enable New Hire Mode to see projected seniority data as a new hire at the bottom of the list.'"
  >
    <template #actions>
      <div class="flex items-center gap-2">
        <USwitch
          v-model="newHireMode.enabled.value"
          label="Enable New Hire Mode"
          description="See projected data as a new hire appended to the bottom of the seniority list."
        />
      </div>
    </template>
  </UAlert>

  <!-- Mode ON: show info banner with fuzziness warning + dropdowns -->
  <div v-else class="space-y-3">
    <UAlert
      icon="i-lucide-info"
      color="info"
      variant="subtle"
      title="New Hire Mode"
      description="Data is approximate. Other new hires may be added ahead of you, and your actual assignment may differ."
    >
      <template #actions>
        <USwitch
          v-model="newHireMode.enabled.value"
          label="Disable"
          size="xs"
        />
      </template>
    </UAlert>

    <div class="flex flex-wrap gap-3">
      <div class="flex flex-col gap-1 min-w-[140px]">
        <label class="text-xs font-medium text-muted">Base</label>
        <USelectMenu
          v-model="newHireMode.selectedBase.value"
          :items="newHireMode.availableBases.value"
          placeholder="Select base..."
          class="w-44"
          size="sm"
          :search-input="false"
          clear
        />
      </div>

      <div class="flex flex-col gap-1 min-w-[140px]">
        <label class="text-xs font-medium text-muted">Seat</label>
        <USelectMenu
          v-model="newHireMode.selectedSeat.value"
          :items="newHireMode.availableSeats.value"
          placeholder="Select seat..."
          class="w-44"
          size="sm"
          :search-input="false"
          clear
        />
      </div>

      <div class="flex flex-col gap-1 min-w-[140px]">
        <label class="text-xs font-medium text-muted">Fleet</label>
        <USelectMenu
          v-model="newHireMode.selectedFleet.value"
          :items="newHireMode.availableFleets.value"
          placeholder="Select fleet..."
          class="w-44"
          size="sm"
          :search-input="false"
          clear
        />
      </div>

      <div class="flex flex-col gap-1 min-w-[140px]">
        <label class="text-xs font-medium text-muted">Birth Date</label>
        <UInput
          :model-value="newHireMode.birthDate.value ?? undefined"
          type="date"
          class="w-44"
          size="sm"
          @update:model-value="newHireMode.birthDate.value = $event || null"
        />
      </div>
    </div>
  </div>
</template>
