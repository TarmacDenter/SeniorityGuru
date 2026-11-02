<script setup lang="ts">
import { useDashboardList } from '~/composables/useDashboardList'

const { loading } = useDashboardList()
</script>

<template>
  <SeniorityListViewer :loading="loading" class="min-h-0 flex-1" />
</template>
