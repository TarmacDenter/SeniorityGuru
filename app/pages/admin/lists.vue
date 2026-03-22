<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { FetchError } from 'ofetch'
import type { AdminSeniorityListResponse } from '#shared/schemas/admin'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

interface AdminUser {
  id: string
  email: string
  role: string
  icao_code: string | null
  employee_number: string | null
  created_at: string
  last_sign_in_at: string | null
}

interface ListWithOwner extends AdminSeniorityListResponse {
  owner_email: string | null
}

const toast = useToast()
const deleteOpen = ref(false)
defineExpose({ confirmDelete, deleteOpen })

const { data: listsData, pending: listsPending, refresh: refreshLists } = await useFetch<AdminSeniorityListResponse[]>('/api/admin/seniority/lists')
const { data: usersData, pending: usersPending } = await useFetch<AdminUser[]>('/api/admin/users')

const fetchError = ref<string | null>(null)

const userMap = computed(() => {
  const map = new Map<string, AdminUser>()
  for (const u of usersData.value ?? []) {
    map.set(u.id, u)
  }
  return map
})

const listsWithOwner = computed<ListWithOwner[]>(() => {
  return (listsData.value ?? []).map(list => ({
    ...list,
    owner_email: userMap.value.get(list.uploaded_by)?.email ?? null,
  }))
})

const userOptions = computed(() =>
  (usersData.value ?? []).map(u => ({ id: u.id, email: u.email }))
)

const columns: TableColumn<ListWithOwner>[] = [
  { accessorKey: 'owner_email', header: 'Owner' },
  { accessorKey: 'airline', header: 'Airline' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'effective_date', header: 'Effective Date' },
  { accessorKey: 'created_at', header: 'Created' },
  { id: 'actions', header: '' },
]

const transferOpen = ref(false)
const transferTarget = ref<ListWithOwner | null>(null)
const transferTargetUser = ref<string | undefined>(undefined)
const transferLoading = ref(false)

function openTransfer(list: ListWithOwner) {
  transferTarget.value = list
  transferTargetUser.value = undefined
  transferOpen.value = true
}

async function doTransfer() {
  if (!transferTarget.value || !transferTargetUser.value) return
  transferLoading.value = true
  try {
    await $fetch(`/api/admin/seniority/${transferTarget.value.id}/transfer`, {
      method: 'PATCH',
      body: { targetUserId: transferTargetUser.value },
    })
    toast.add({ title: 'List transferred', color: 'success' })
    transferOpen.value = false
    await refreshLists()
  } catch {
    toast.add({ title: 'Failed to transfer list', color: 'error' })
  } finally {
    transferLoading.value = false
  }
}

const deleteTarget = ref<ListWithOwner | null>(null)
const deleteLoading = ref(false)

function confirmDelete(list: ListWithOwner) {
  deleteTarget.value = list
  deleteOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/seniority/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'List deleted', color: 'success' })
    deleteOpen.value = false
    await refreshLists()
  } catch (e: unknown) {
    const message = e instanceof FetchError ? (e.data?.statusMessage ?? 'Failed to delete') : 'Failed to delete'
    toast.add({ title: message, color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}

const uploadPickerOpen = ref(false)
const uploadTargetUser = ref<string | undefined>(undefined)

async function goToUpload() {
  if (!uploadTargetUser.value) return
  const targetId = uploadTargetUser.value
  uploadPickerOpen.value = false
  await navigateTo({ path: '/seniority/upload', query: { userId: targetId } })
}


</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Seniority Lists">
        <template #right>
          <UModal v-model:open="uploadPickerOpen" title="Upload for User" description="Choose a user to upload a list on their behalf">
            <UButton label="Upload for User" icon="i-lucide-upload" />
            <template #body>
              <UFormField label="Select User">
                <USelectMenu
                  v-model="uploadTargetUser"
                  :items="userOptions"
                  value-key="id"
                  label-key="email"
                  placeholder="Search users..."
                  searchable
                  class="w-full"
                />
              </UFormField>
            </template>
            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton label="Cancel" color="neutral" variant="ghost" @click="uploadPickerOpen = false" />
                <UButton label="Go to Upload" :disabled="!uploadTargetUser" @click="goToUpload" />
              </div>
            </template>
          </UModal>
        </template>
      </SeniorityNavbar>
    </template>

    <template #body>
      <div class="p-4 space-y-3">
        <UAlert v-if="fetchError" icon="i-lucide-alert-triangle" color="error" :title="fetchError" />

        <div class="overflow-x-auto">
          <UTable
            :data="listsWithOwner"
            :columns="columns"
            :loading="listsPending || usersPending"
          >
            <template #owner_email-cell="{ row }">
              <span class="text-sm">{{ row.original.owner_email ?? '—' }}</span>
            </template>
            <template #effective_date-cell="{ row }">
              {{ row.original.effective_date }}
            </template>
            <template #created_at-cell="{ row }">
              {{ new Date(row.original.created_at).toLocaleDateString() }}
            </template>
            <template #actions-cell="{ row }">
              <div class="flex gap-1">
                <UButton
                  icon="i-lucide-arrow-right-left"
                  variant="ghost"
                  size="xs"
                  label="Transfer"
                  @click="openTransfer(row.original)"
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

        <!-- Transfer Modal -->
        <UModal v-model:open="transferOpen" title="Transfer List" description="Assign this list to a different user">
          <template #body>
            <UFormField label="Transfer to">
              <USelectMenu
                v-model="transferTargetUser"
                :items="userOptions"
                value-key="id"
                label-key="email"
                placeholder="Search users..."
                searchable
                class="w-full"
              />
            </UFormField>
          </template>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton label="Cancel" color="neutral" variant="ghost" @click="transferOpen = false" />
              <UButton label="Transfer" :loading="transferLoading" :disabled="!transferTargetUser" @click="doTransfer" />
            </div>
          </template>
        </UModal>

        <!-- Delete Confirm Modal -->
        <UModal v-model:open="deleteOpen" title="Delete List" description="This action cannot be undone.">
          <template #body>
            <p>
              Are you sure you want to delete
              <strong>{{ deleteTarget?.title ?? 'this list' }}</strong> ({{ deleteTarget?.airline }})?
              All entries will be permanently removed.
            </p>
          </template>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton label="Cancel" color="neutral" variant="ghost" @click="deleteOpen = false" />
              <UButton label="Delete List" color="error" :loading="deleteLoading" @click="doDelete" />
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
