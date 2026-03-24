<script setup lang="ts">
import { appTheme } from '~/theme';
</script>

<template>
  <UApp :scroll-body="false">
    <UTheme :ui="appTheme">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UTheme>
  </UApp>
</template>
