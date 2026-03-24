<script setup lang="ts">
import { appTheme } from '~/theme'
</script>

<template>
  <UApp>
    <UTheme :ui="appTheme">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UTheme>
  </UApp>
</template>
