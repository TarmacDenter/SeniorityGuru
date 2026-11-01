<script setup lang="ts">
import { useSeniorityCore, useTrajectory } from '~/composables/seniority'
import { useDashboardList } from '~/composables/useDashboardList'

const { loading } = useDashboardList()
const { hasData, hasAnchor: userFound } = useSeniorityCore()
const { qualificationScope, growthAssumptions } = useScenario()
const { chartData, keyChanges, hypotheticalLabel, endedByLabel } = useTrajectory(growthAssumptions, qualificationScope)
</script>

<template>
  <DashboardTabsProjectionTab
    :loading="loading"
    :has-data="hasData"
    :user-found="userFound"
    :chart-data="chartData"
    :ended-by-label="endedByLabel"
    :key-changes="keyChanges"
    :hypothetical-label="hypotheticalLabel"
  />
</template>
