<script setup lang="ts">
const user = useSupabaseUser()
</script>

<template>
  <ULink :to="user ? '/dashboard' : '/'" class="font-bold text-xl inline-flex items-center gap-2 justify-center mb-6">
    <UIcon name="i-lucide-plane" class="size-6 text-primary" />
    <span class="text-highlighted">SeniorityGuru</span>
  </ULink>
</template>
