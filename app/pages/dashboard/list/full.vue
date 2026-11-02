<script setup lang="ts">
import { useDashboardList } from '~/composables/useDashboardList'

const { loading, selectedListId, listOptions, isDemoList, isHistorical } = useDashboardList()
</script>

<template>
  <SeniorityListViewer :loading="loading" class="min-h-0 flex-1">
    <!-- On a short screen the shell's list picker is hidden; it sits beside Controls instead. -->
    <template #compact-lead>
      <DashboardListPicker
        v-model:selected-list-id="selectedListId"
        inline
        class="hidden short:flex flex-1"
        :list-options="listOptions"
        :is-demo="isDemoList"
        :is-historical="isHistorical"
      />
    </template>
  </SeniorityListViewer>
</template>
