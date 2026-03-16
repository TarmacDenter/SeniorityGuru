<template>
  <UDashboardNavbar :title="description ? undefined : title">
    <template v-if="description" #title>
      <div class="flex flex-col leading-none gap-0.5">
        <span class="font-semibold text-sm">{{ title }}</span>
        <span class="text-xs text-muted font-normal">{{ description }}</span>
      </div>
    </template>

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
  description?: string
}>()

const user = useSupabaseUser()
const { signOut } = useSignOut()
</script>
