<script setup lang="ts">
import { appTheme } from '~/theme';

const isDev = import.meta.dev
</script>

<template>
  <UApp :scroll-body="false">
    <UTheme :ui="appTheme">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UTheme>
    <LazyDevColorInspector v-if="isDev" />
  </UApp>
</template>
