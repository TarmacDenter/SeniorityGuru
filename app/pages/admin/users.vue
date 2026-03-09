<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="User Management">
        <template #right>
          <UModal v-model:open="inviteOpen" title="Invite User" description="Send an invite link via email">
            <UButton label="Invite User" icon="i-lucide-mail-plus" />

            <template #body>
              <UFormField label="Email address">
                <UInput v-model="inviteEmail" type="email" placeholder="pilot@example.com" class="w-full" />
              </UFormField>
            </template>

            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton label="Cancel" color="neutral" variant="ghost" @click="inviteOpen = false" />
                <UButton label="Send Invite" :loading="inviteLoading" @click="sendInvite" />
              </div>
            </template>
          </UModal>
        </template>
      </SeniorityNavbar>
    </template>

    <template #body>
    <div class="p-4">
      <UAlert v-if="fetchError" icon="i-lucide-alert-triangle" color="error" :title="fetchError" class="mb-4" />

      <UTable
        ref="table"
        :data="users"
        :columns="columns"
        :loading="loading"
        :ui="{ tr: 'data-[selected=true]:bg-(--ui-bg-elevated)' }"
      >
        <template #role-cell="{ row }">
          <USelectMenu
            :model-value="row.original.role"
            :items="roleOptions"
            class="w-32"
            :loading="updatingRole === row.original.id"
            @update:model-value="(val: string) => updateRole(row.original.id, val)"
          />
        </template>

        <template #actions-cell="{ row }">
          <UButton
            icon="i-lucide-key-round"
            variant="ghost"
            size="xs"
            label="Reset Password"
            :loading="resettingPassword === row.original.id"
            @click="resetPassword(row.original)"
          />
        </template>
      </UTable>
    </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'seniority',
})

interface AdminUser {
  id: string
  email: string
  role: string
  icao_code: string | null
  employee_number: string | null
  created_at: string
  last_sign_in_at: string | null
}

const toast = useToast()
const loading = ref(true)
const fetchError = ref<string | null>(null)
const users = ref<AdminUser[]>([])

const updatingRole = ref<string | null>(null)
const resettingPassword = ref<string | null>(null)
const inviteOpen = ref(false)
const inviteEmail = ref('')
const inviteLoading = ref(false)

const roleOptions = ['user', 'moderator', 'admin']

const columns: TableColumn<AdminUser>[] = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'icao_code', header: 'Airline' },
  { accessorKey: 'employee_number', header: 'Employee #' },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  { id: 'actions', header: '' },
]

async function fetchUsers() {
  loading.value = true
  fetchError.value = null
  try {
    users.value = await $fetch<AdminUser[]>('/api/admin/users')
  }
  catch (e: any) {
    fetchError.value = e.data?.message || 'Failed to load users'
  }
  finally {
    loading.value = false
  }
}

async function updateRole(userId: string, role: string) {
  updatingRole.value = userId
  try {
    await $fetch(`/api/admin/users/${userId}`, { method: 'PATCH', body: { role } })
    const user = users.value.find(u => u.id === userId)
    if (user) user.role = role
    toast.add({ title: 'Role updated', color: 'success' })
  }
  catch {
    toast.add({ title: 'Failed to update role', color: 'error' })
  }
  finally {
    updatingRole.value = null
  }
}

async function resetPassword(user: AdminUser) {
  resettingPassword.value = user.id
  try {
    await $fetch('/api/admin/reset-password', { method: 'POST', body: { userId: user.id } })
    toast.add({ title: 'Password reset sent', description: `Recovery email sent to ${user.email}`, color: 'success' })
  }
  catch {
    toast.add({ title: 'Failed to send reset', color: 'error' })
  }
  finally {
    resettingPassword.value = null
  }
}

async function sendInvite() {
  if (!inviteEmail.value) return
  inviteLoading.value = true
  try {
    await $fetch('/api/admin/invite', { method: 'POST', body: { email: inviteEmail.value } })
    toast.add({ title: 'Invite sent', description: inviteEmail.value, color: 'success' })
    inviteEmail.value = ''
    inviteOpen.value = false
  }
  catch {
    toast.add({ title: 'Failed to send invite', color: 'error' })
  }
  finally {
    inviteLoading.value = false
  }
}

onMounted(fetchUsers)
</script>
