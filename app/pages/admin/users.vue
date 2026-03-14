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
    <div class="p-4 space-y-3">
      <UAlert v-if="fetchError" icon="i-lucide-alert-triangle" color="error" :title="fetchError" />

      <UInput
        v-model="globalFilter"
        icon="i-lucide-search"
        placeholder="Search users..."
        class="max-w-sm"
      />

      <div class="overflow-x-auto">
        <UTable
          ref="usersTable"
          v-model:global-filter="globalFilter"
          v-model:pagination="pagination"
          v-model:sorting="sorting"
          :data="users"
          :columns="columns"
          :loading="loading"
          :pagination-options="paginationOptions"
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
            <div class="flex gap-1">
              <UButton
                icon="i-lucide-key-round"
                variant="ghost"
                size="xs"
                label="Reset Password"
                :loading="resettingPassword === row.original.id"
                @click="resetPassword(row.original)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="xs"
                @click="confirmDelete(row.original)"
              />
            </div>
          </template>
        </UTable>
      </div>

      <UModal v-model:open="deleteOpen" title="Delete User" description="This action cannot be undone.">
        <template #body>
          <p>
            Are you sure you want to delete <strong>{{ deleteTarget?.email }}</strong>?
            Their profile and all uploaded seniority lists will be permanently removed.
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" color="neutral" variant="ghost" @click="deleteOpen = false" />
            <UButton label="Delete User" color="error" :loading="deleteLoading" @click="deleteUser" />
          </div>
        </template>
      </UModal>

      <div class="flex items-center justify-between">
        <p class="text-sm text-muted">{{ totalRows }} results</p>
        <UPagination
          v-if="pageCount > 1"
          :page="currentPage"
          :total="totalRows"
          :items-per-page="pagination.pageSize"
          @update:page="(p: number) => usersTable?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { FetchError } from 'ofetch'
import { sortableHeader } from '~/utils/sortableHeader'
import type { AdminGetUsersSeniorityListCountResponseDto } from '~~/server/api/admin/seniority/upload_count.get';

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'dashboard',
})

interface AdminUser {
  id: string
  email: string
  role: string
  icao_code: string | null
  employee_number: string | null
  created_at: string
  last_sign_in_at: string | null
  upload_count: number
}

const {
  tableRef: usersTable,
  globalFilter,
  sorting,
  pagination,
  paginationOptions,
  currentPage,
  pageCount,
  totalRows,
} = useTableFeatures<AdminUser>('usersTable', { pageSize: 25 })

const toast = useToast()
const loading = ref(true)
const fetchError = ref<string | null>(null)
const users = ref<AdminUser[]>([])

const updatingRole = ref<string | null>(null)
const resettingPassword = ref<string | null>(null)
const inviteOpen = ref(false)
const inviteEmail = ref('')
const inviteLoading = ref(false)
const deleteOpen = ref(false)
const deleteTarget = ref<AdminUser | null>(null)
const deleteLoading = ref(false)

const roleOptions = ['user', 'moderator', 'admin']

const columns: TableColumn<AdminUser>[] = [
  { accessorKey: 'email', header: sortableHeader<AdminUser>('Email') },
  { accessorKey: 'role', header: sortableHeader<AdminUser>('Role') },
  { accessorKey: 'icao_code', header: sortableHeader<AdminUser>('Airline') },
  { accessorKey: 'employee_number', header: sortableHeader<AdminUser>('Employee #') },
  {
    accessorKey: 'created_at',
    header: sortableHeader<AdminUser>('Created'),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  { accessorKey: 'upload_count', header: sortableHeader<AdminUser>('Uploads') },
  { id: 'actions', header: '' },
]

async function fetchUsers() {
  loading.value = true
  fetchError.value = null
  try {
    users.value = await $fetch<AdminUser[]>('/api/admin/users')
    const userUploadCounts = await $fetch<AdminGetUsersSeniorityListCountResponseDto>('/api/admin/seniority/upload_count')
    const countsMap = new Map(userUploadCounts.map(c => [c.userId, c.count]))
    users.value.forEach(u => u.upload_count = countsMap.get(u.id) ?? 0)
  }
  catch (e: unknown) {
    fetchError.value = e instanceof FetchError ? (e.data?.message ?? 'Failed to load users') : 'Failed to load users'
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
  catch (e: unknown) {
    const message = e instanceof FetchError && e.statusCode === 409
      ? 'This user is already registered and active'
      : 'Failed to send invite'
    toast.add({ title: message, color: 'error' })
  }
  finally {
    inviteLoading.value = false
  }
}

function confirmDelete(user: AdminUser) {
  deleteTarget.value = user
  deleteOpen.value = true
}

async function deleteUser() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/users/${deleteTarget.value.id}`, { method: 'DELETE' })
    users.value = users.value.filter(u => u.id !== deleteTarget.value!.id)
    toast.add({ title: 'User deleted', color: 'success' })
    deleteOpen.value = false
  }
  catch (e: unknown) {
    const message = e instanceof FetchError && e.statusCode === 400
      ? (e.data?.statusMessage ?? 'Cannot delete this user')
      : 'Failed to delete user'
    toast.add({ title: message, color: 'error' })
  }
  finally {
    deleteLoading.value = false
  }
}

onMounted(fetchUsers)
</script>
