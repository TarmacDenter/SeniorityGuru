<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar :title="user?.email ?? 'User Detail'">
        <template #left>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            size="sm"
            @click="navigateTo('/admin/users')"
          />
        </template>
      </SeniorityNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6 max-w-4xl">
        <!-- Profile Card -->
        <UCard v-if="user">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">Profile</h2>
              <UButton
                icon="i-lucide-pencil"
                size="sm"
                variant="ghost"
                label="Edit Profile"
                @click="openEditProfile"
              />
            </div>
          </template>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-muted">Email</p>
              <p class="font-medium break-all">{{ user.email ?? '—' }}</p>
            </div>
            <div>
              <p class="text-muted">Role</p>
              <UBadge :label="user.role" :color="user.role === 'admin' ? 'primary' : 'neutral'" variant="subtle" />
            </div>
            <div>
              <p class="text-muted">Airline</p>
              <p class="font-medium">{{ user.icao_code ?? '—' }}</p>
            </div>
            <div>
              <p class="text-muted">Employee #</p>
              <p class="font-medium">{{ user.employee_number ?? '—' }}</p>
            </div>
            <div>
              <p class="text-muted">Joined</p>
              <p class="font-medium">{{ new Date(user.created_at).toLocaleDateString() }}</p>
            </div>
            <div>
              <p class="text-muted">Last Sign-in</p>
              <p class="font-medium">{{ user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never' }}</p>
            </div>
          </div>
        </UCard>

        <div v-else-if="userPending" class="h-40 animate-pulse bg-elevated rounded" />

        <!-- Seniority Lists -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">Seniority Lists</h2>
              <UButton
                icon="i-lucide-upload"
                size="sm"
                label="Upload for this user"
                @click="navigateTo({ path: '/seniority/upload', query: { userId: userId } })"
              />
            </div>
          </template>
          <UTable
            :data="userLists"
            :columns="listColumns"
            :loading="listsPending"
          >
            <template #effective_date-cell="{ row }">
              {{ row.original.effective_date }}
            </template>
            <template #actions-cell="{ row }">
              <div class="flex gap-1">
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  color="error"
                  size="xs"
                  @click="confirmDeleteList(row.original)"
                />
              </div>
            </template>
          </UTable>
        </UCard>

        <!-- Danger Zone -->
        <UCard class="border border-error">
          <template #header>
            <h2 class="text-base font-semibold text-error">Danger Zone</h2>
          </template>
          <div class="flex flex-wrap gap-3">
            <UButton
              icon="i-lucide-key-round"
              color="neutral"
              variant="outline"
              label="Reset Password"
              :loading="resettingPassword"
              @click="resetPassword"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              label="Delete Account"
              @click="confirmDelete"
            />
          </div>
        </UCard>
      </div>

      <!-- Delete User Modal -->
      <UModal v-model:open="deleteOpen" title="Delete Account" description="This action cannot be undone.">
        <template #body>
          <p>
            Are you sure you want to delete <strong>{{ user?.email }}</strong>?
            Their profile and all seniority lists will be permanently removed.
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" color="neutral" variant="ghost" @click="deleteOpen = false" />
            <UButton label="Delete Account" color="error" :loading="deleteLoading" @click="doDelete" />
          </div>
        </template>
      </UModal>

      <!-- Delete List Modal -->
      <UModal v-model:open="deleteListOpen" title="Delete List" description="This action cannot be undone.">
        <template #body>
          <p>
            Delete list <strong>{{ deleteListTarget?.title ?? 'Untitled' }}</strong> ({{ deleteListTarget?.airline }})?
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" color="neutral" variant="ghost" @click="deleteListOpen = false" />
            <UButton label="Delete" color="error" :loading="deleteListLoading" @click="doDeleteList" />
          </div>
        </template>
      </UModal>

      <!-- Edit Profile Modal -->
      <UModal v-model:open="editProfileOpen" title="Edit Profile">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Airline">
              <USelectMenu
                v-model="editProfileForm.icaoCode"
                :items="airlineOptions"
                value-key="value"
                :loading="airlinesLoading"
                placeholder="Select airline"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Employee Number">
              <UInput
                v-model="editProfileForm.employeeNumber"
                placeholder="e.g. 12345"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Mandatory Retirement Age">
              <UInputNumber
                v-model="editProfileForm.mandatoryRetirementAge"
                :min="55"
                :max="75"
                class="w-full"
              />
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" color="neutral" variant="ghost" @click="editProfileOpen = false" />
            <UButton label="Save" :loading="editProfileLoading" @click="saveProfile()" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { FetchError } from 'ofetch'
import type { AdminUserDetail } from '#shared/schemas/admin'
import type { AdminSeniorityListResponse } from '#shared/schemas/admin'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const route = useRoute()
const userId = route.params.id as string
const toast = useToast()

const { data: user, pending: userPending } = await useFetch<AdminUserDetail>(`/api/admin/users/${userId}`)
const { data: listsData, pending: listsPending, refresh: refreshLists } = await useFetch<AdminSeniorityListResponse[]>('/api/admin/seniority/lists')

const userLists = computed(() =>
  (listsData.value ?? []).filter(l => l.uploaded_by === userId)
)

const listColumns: TableColumn<AdminSeniorityListResponse>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'airline', header: 'Airline' },
  { accessorKey: 'effective_date', header: 'Effective Date' },
  { id: 'actions', header: '' },
]

// Delete User
const deleteOpen = ref(false)
const deleteLoading = ref(false)

function confirmDelete() {
  deleteOpen.value = true
}

async function doDelete() {
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    toast.add({ title: 'Account deleted', color: 'success' })
    deleteOpen.value = false
    await navigateTo('/admin/users')
  } catch (e: unknown) {
    const message = e instanceof FetchError && e.statusCode === 400
      ? (e.data?.statusMessage ?? 'Cannot delete this user')
      : 'Failed to delete account'
    toast.add({ title: message, color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}

// Reset Password
const resettingPassword = ref(false)

async function resetPassword() {
  resettingPassword.value = true
  try {
    await $fetch('/api/admin/reset-password', { method: 'POST', body: { userId } })
    toast.add({ title: 'Password reset email sent', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to send reset email', color: 'error' })
  } finally {
    resettingPassword.value = false
  }
}

// Airline options for the edit modal
const { options: airlineOptions, loading: airlinesLoading, load: loadAirlines } = useAirlineOptions()

// Edit profile modal state
const editProfileOpen = ref(false)
const editProfileLoading = ref(false)
const editProfileForm = ref<{
  icaoCode: string | undefined
  employeeNumber: string | undefined
  mandatoryRetirementAge: number
}>({
  icaoCode: user.value?.icao_code ?? undefined,
  employeeNumber: user.value?.employee_number ?? undefined,
  mandatoryRetirementAge: user.value?.mandatory_retirement_age ?? 65,
})

function openEditProfile() {
  editProfileForm.value = {
    icaoCode: user.value?.icao_code ?? undefined,
    employeeNumber: user.value?.employee_number ?? undefined,
    mandatoryRetirementAge: user.value?.mandatory_retirement_age ?? 65,
  }
  loadAirlines()
  editProfileOpen.value = true
}

async function saveProfile(overrides?: Record<string, unknown>) {
  const payload = overrides ?? editProfileForm.value
  editProfileLoading.value = true
  try {
    const updated = await $fetch<{
      id: string
      icao_code: string | null
      employee_number: string | null
      mandatory_retirement_age: number
    }>(`/api/admin/users/${userId}/profile`, {
      method: 'PATCH',
      body: payload,
    })
    if (user.value) {
      user.value.icao_code = updated.icao_code
      user.value.employee_number = updated.employee_number
      user.value.mandatory_retirement_age = updated.mandatory_retirement_age
    }
    editProfileOpen.value = false
    toast.add({ title: 'Profile updated', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to update profile', color: 'error' })
  } finally {
    editProfileLoading.value = false
  }
}

// Delete List
const deleteListOpen = ref(false)
const deleteListTarget = ref<AdminSeniorityListResponse | null>(null)
const deleteListLoading = ref(false)

function confirmDeleteList(list: AdminSeniorityListResponse) {
  deleteListTarget.value = list
  deleteListOpen.value = true
}

async function doDeleteList() {
  if (!deleteListTarget.value) return
  deleteListLoading.value = true
  try {
    await $fetch(`/api/admin/seniority/${deleteListTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'List deleted', color: 'success' })
    deleteListOpen.value = false
    await refreshLists()
  } catch {
    toast.add({ title: 'Failed to delete list', color: 'error' })
  } finally {
    deleteListLoading.value = false
  }
}

defineExpose({ confirmDelete, deleteOpen, saveProfile })
</script>
