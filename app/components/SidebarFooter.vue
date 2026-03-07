<template>
  <div class="flex flex-col gap-2 p-2 overflow-hidden">
    <UUser
      v-if="!collapsed"
      :name="user?.email ?? 'Pilot'"
      :avatar="{ icon: 'i-lucide-circle-user' }"
      size="sm"
      :ui="{ root: 'min-w-0 overflow-hidden', name: 'truncate' }"
    />
    <div class="flex items-center" :class="collapsed ? 'justify-center' : 'justify-between'">
      <UButton
        v-if="!collapsed"
        variant="ghost"
        color="neutral"
        size="xs"
        label="Sign out"
        icon="i-lucide-log-out"
        @click="signOut"
      />
      <UDashboardSidebarCollapse />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const user = useSupabaseUser()
const supabase = useSupabaseClient()

async function signOut() {
  await supabase.auth.signOut()
  navigateTo('/auth/login')
}
</script>
