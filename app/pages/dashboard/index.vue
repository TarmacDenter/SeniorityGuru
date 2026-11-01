<script setup lang="ts">
import { dashboardPathForTab, keepQuery } from '~/utils/dashboard-sections'

// Old /dashboard and ?tab= links open the small view that now holds that content.
const route = useRoute()
navigateTo({ path: dashboardPathForTab(route.query.tab as string | undefined), query: keepQuery(route.query, ['list']) }, { replace: true })
</script>

<template>
  <div />
</template>
