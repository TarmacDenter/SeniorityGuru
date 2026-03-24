<template>
  <UHeader to="/dashboard">
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
      <UButton to="/dashboard" variant="ghost" size="sm">Go to Dashboard</UButton>
    </template>
  </UHeader>
</template>
