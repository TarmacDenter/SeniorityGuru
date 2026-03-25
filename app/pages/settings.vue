<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Settings" />
    </template>

    <template #body>
      <div class="max-w-2xl mx-auto space-y-6 p-4 sm:p-6">
        <SettingsProfileCard />
        <SettingsPreferencesCard />
        <SettingsNewHireModeCard />
        <SettingsDebugLogCard />
        <SettingsClearDataCard />
      </div>
    </template>
  </UDashboardPanel>
</template>
