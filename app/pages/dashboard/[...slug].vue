<script setup lang="ts">
import { dashboardPathForSection, keepQuery } from '~/utils/dashboard-sections'

// A section address without a small view, or an unknown one, opens the section's first view (Current › Status when unknown).
const route = useRoute()
const slug = route.params.slug
const section = Array.isArray(slug) && slug.length === 1 ? String(slug[0]) : undefined
navigateTo({ path: dashboardPathForSection(section), query: keepQuery(route.query, ['list']) }, { replace: true })
</script>

<template>
  <div />
</template>
