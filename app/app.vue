<template>
  <UApp>
    <UTheme :ui="appTheme">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UTheme>
  </UApp>
</template>

<script setup lang="ts">
const appTheme = {
  card: {
    root: 'backdrop-blur-sm'
  },
  dashboardSidebar: {
    root: 'bg-muted/80 backdrop-blur-sm'
  }
}
</script>
