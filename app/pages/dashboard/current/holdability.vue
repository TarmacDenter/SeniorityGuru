<script setup lang="ts">
import { useHoldability, useSeniorityCore } from '~/composables/seniority'
import { useDashboardList } from '~/composables/useDashboardList'

const { loading } = useDashboardList()
const { hasAnchor: userFound } = useSeniorityCore()
const { qualificationScope, growthAssumptions } = useScenario()
const { visibleGroups, seatOptions, selectedSeat, noResultLabel, columnLabels, selectedKey, select, detail, juniorCaptainsLink } = useHoldability(qualificationScope, growthAssumptions)
</script>

<template>
  <DashboardTabsQualificationsTab
    v-model:selected-seat="selectedSeat"
    :loading="loading"
    :user-found="userFound"
    :groups="visibleGroups"
    :seat-options="seatOptions"
    :no-result-label="noResultLabel"
    :column-labels="columnLabels"
    :selected-key="selectedKey"
    :detail="detail"
    :junior-captains-link="juniorCaptainsLink"
    @select="select"
  />
</template>
