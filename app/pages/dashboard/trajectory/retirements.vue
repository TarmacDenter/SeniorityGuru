<script setup lang="ts">
import { useSeniorityCore } from '~/composables/seniority'
import { useDashboardList } from '~/composables/useDashboardList'

const { loading } = useDashboardList()
const { hasData, hasAnchor: userFound } = useSeniorityCore()
</script>

<template>
  <DashboardTabsTrajectoryRetirementsTab :loading="loading" :has-data="hasData" :user-found="userFound" />
</template>
