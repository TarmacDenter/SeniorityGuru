<script setup lang="ts">
import { useSeniorityCore, useStanding, useListExcerpt } from '~/composables/seniority'
import { useDashboardList } from '~/composables/useDashboardList'

const { loading } = useDashboardList()
const { employeeNumber } = useUser()
const { hasData, hasAnchor: userFound, isNewHireMode, newHire } = useSeniorityCore()
const hasEmployeeNumber = computed(() => !!employeeNumber.value || !!newHire.syntheticEntry.value)
const { qualificationScope } = useScenario()
const { rankCard, figures, qualificationGroups } = useStanding(qualificationScope)
const { rows: excerptRows } = useListExcerpt()
</script>

<template>
  <DashboardTabsMyStatusTab
    :loading="loading"
    :has-data="hasData"
    :has-employee-number="hasEmployeeNumber"
    :user-found="userFound"
    :is-new-hire-mode="isNewHireMode"
    :rank-card="rankCard"
    :figures="figures"
    :excerpt-rows="excerptRows"
    :qualification-groups="qualificationGroups"
  />
</template>
