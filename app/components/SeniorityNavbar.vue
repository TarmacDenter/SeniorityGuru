<template>
  <UDashboardNavbar :title="title">
    <template #left>
      <slot name="left" />
    </template>

    <template #right>
      <slot name="right" />
      <ClientOnly>
        <UButton v-if="user" variant="ghost" size="sm" @click="signOut">Sign out</UButton>
        <UButton v-else to="/auth/login" size="sm">Sign in</UButton>
      </ClientOnly>
    </template>
  </UDashboardNavbar>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()

const user = useSupabaseUser()
const { signOut } = useSignOut()
</script>
