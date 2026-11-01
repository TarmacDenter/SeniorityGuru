<script setup lang="ts">
import { useSeniorityCore, useStanding } from '~/composables/seniority'
import { useDashboardList } from '~/composables/useDashboardList'

const { loading } = useDashboardList()
const { hasAnchor: userFound } = useSeniorityCore()
const { qualificationScope } = useScenario()
const { rankCard, qualificationGroups } = useStanding(qualificationScope)
</script>

<template>
  <DashboardTabsQualificationsTab
    :loading="loading"
    :user-found="userFound"
    :groups="qualificationGroups"
    :no-result-label="rankCard.noResultLabel"
  />
</template>
