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
        <UButton v-if="user" variant="ghost" size="sm" @click="signOut">Sign out</UButton>
        <UButton v-else to="/auth/login" size="sm">Sign in</UButton>
      </ClientOnly>
    </template>
  </UHeader>
</template>
