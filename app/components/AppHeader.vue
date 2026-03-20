<script setup lang="ts">
const user = useSupabaseUser()
const { signOut } = useSignOut()
</script>

<template>
  <UHeader :to="user ? '/dashboard' : '/'">
    <template #title>
      <span class="inline-flex items-center gap-2">
        <UIcon name="i-lucide-plane" class="size-5 text-primary" />
        <span>SeniorityGuru</span>
      </span>
    </template>
    <template #left>
      <slot name="left" />
    </template>
    <template #right>
      <ClientOnly>
        <template v-if="user">
          <UButton to="/dashboard" variant="ghost" size="sm">Go to Dashboard</UButton>
          <UButton variant="ghost" size="sm" @click="signOut">Sign out</UButton>
        </template>
        <UButton v-else to="/auth/login" size="sm">Sign in</UButton>
      </ClientOnly>
    </template>
  </UHeader>
</template>
