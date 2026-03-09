<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-center">Invite Only</h1>

    <UAlert
      icon="i-lucide-lock"
      color="info"
      variant="soft"
      title="This service is currently invite-only"
      description="If you've received an invite, check your email for the access link. Contact your administrator to request access."
    />

    <p class="mt-4 text-center text-sm text-muted">
      Already have an account?
      <ULink to="/auth/login" class="text-primary hover:underline">Sign in</ULink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
</script>
