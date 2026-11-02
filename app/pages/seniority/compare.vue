<script setup lang="ts">
import { keepQuery } from '~/utils/dashboard-sections'

// Compare moved into List › Compare.
const route = useRoute()
navigateTo({ path: '/dashboard/list/compare', query: keepQuery(route.query, ['a', 'b']) }, { replace: true })
</script>

<template>
  <div />
</template>
