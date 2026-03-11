<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="My Lists">
        <template #right>
          <UButton label="Upload New" icon="i-lucide-upload" to="/seniority/upload" />
        </template>
      </SeniorityNavbar>
    </template>

    <template #body>
      <div class="p-4 space-y-3">
        <UAlert v-if="seniorityStore.listsError" icon="i-lucide-alert-triangle" color="error" :title="seniorityStore.listsError" />

        <UInput
          v-model="globalFilter"
          icon="i-lucide-search"
          placeholder="Search lists..."
          class="max-w-sm"
        />

        <div class="overflow-x-auto">
          <UTable
            ref="listsTable"
            :data="seniorityStore.lists"
            :columns="columns"
            :loading="seniorityStore.listsLoading"
            v-model:global-filter="globalFilter"
            v-model:pagination="pagination"
            v-model:sorting="sorting"
            :pagination-options="paginationOptions"
          >
            <template #actions-cell="{ row }">
              <div class="flex gap-1">
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  size="xs"
                  label="Edit"
                  @click="openEdit(row.original)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  size="xs"
                  color="error"
                  label="Delete"
                  :loading="deleting === row.original.id"
                  @click="confirmDelete(row.original)"
                />
              </div>
            </template>
          </UTable>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-muted">{{ totalRows }} lists</p>
          <UPagination
            v-if="pageCount > 1"
            :page="currentPage"
            :total="totalRows"
            :items-per-page="pagination.pageSize"
            @update:page="(p: number) => listsTable?.tableApi?.setPageIndex(p - 1)"
          />
        </div>

        <!-- Edit Modal -->
        <UModal v-model:open="editOpen" title="Edit List" description="Update the title or effective date">
          <template #body>
            <UForm :schema="UpdateSeniorityListSchema" :state="editState" class="space-y-4" @submit="saveEdit">
              <UFormField label="Airline">
                <UInput :model-value="editAirline" disabled class="w-full" />
              </UFormField>
              <UFormField label="Title" name="title">
                <UInput v-model="editState.title" placeholder="Optional title" class="w-full" />
              </UFormField>
              <UFormField label="Effective Date" name="effective_date">
                <UInput v-model="editState.effective_date" type="date" class="w-full" />
              </UFormField>
              <div class="flex justify-end gap-2">
                <UButton label="Cancel" color="neutral" variant="ghost" @click="editOpen = false" />
                <UButton type="submit" label="Save" :loading="saving" />
              </div>
            </UForm>
          </template>
        </UModal>

        <!-- Delete Confirmation Modal -->
        <UModal v-model:open="deleteOpen" title="Delete List" description="This action cannot be undone.">
          <template #body>
            <p class="text-sm text-muted mb-4">
              Are you sure you want to delete the list
              <strong>{{ deleteTarget?.airline }} — {{ deleteTarget?.effective_date }}</strong>?
              All entries in this list will be permanently removed.
            </p>
            <div class="flex justify-end gap-2">
              <UButton label="Cancel" color="neutral" variant="ghost" @click="deleteOpen = false" />
              <UButton label="Delete" color="error" :loading="deleting === deleteTarget?.id" @click="doDelete" />
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SeniorityListResponse } from '#shared/schemas/seniority-list'
import { UpdateSeniorityListSchema } from '#shared/schemas/seniority-list'
import { sortableHeader } from '~/utils/sortableHeader'
import { useSeniorityStore } from '~/stores/seniority'

definePageMeta({
  middleware: 'auth',
  layout: 'seniority',
})

type SeniorityList = SeniorityListResponse

const seniorityStore = useSeniorityStore()
const toast = useToast()

const {
  tableRef: listsTable,
  globalFilter,
  sorting,
  pagination,
  paginationOptions,
  currentPage,
  pageCount,
  totalRows,
} = useTableFeatures<SeniorityList>('listsTable', {
  pageSize: 25,
  defaultSorting: [{ id: 'effective_date', desc: true }],
})

const columns: TableColumn<SeniorityList>[] = [
  { accessorKey: 'airline', header: sortableHeader<SeniorityList>('Airline') },
  { accessorKey: 'title', header: sortableHeader<SeniorityList>('Title') },
  { accessorKey: 'effective_date', header: sortableHeader<SeniorityList>('Effective Date') },
  {
    accessorKey: 'created_at',
    header: sortableHeader<SeniorityList>('Uploaded'),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    accessorKey: 'status',
    header: sortableHeader<SeniorityList>('Status'),
    cell: ({ row }) => row.original.status === 'active' ? 'Active' : 'Archived',
  },
  { id: 'actions', header: '' },
]

// --- Edit ---
const editOpen = ref(false)
const saving = ref(false)
const editListId = ref<string | null>(null)
const editAirline = ref('')
const editState = reactive({
  title: '',
  effective_date: '',
})

function openEdit(list: SeniorityList) {
  editListId.value = list.id
  editAirline.value = list.airline
  editState.title = list.title ?? ''
  editState.effective_date = list.effective_date
  editOpen.value = true
}

async function saveEdit() {
  if (!editListId.value) return

  saving.value = true
  try {
    await seniorityStore.updateList(editListId.value, {
      ...(editState.title && { title: editState.title }),
      effective_date: editState.effective_date,
    })
    toast.add({ title: 'List updated', color: 'success' })
    editOpen.value = false
  }
  catch {
    toast.add({ title: 'Failed to update list', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

// --- Delete ---
const deleteOpen = ref(false)
const deleting = ref<string | null>(null)
const deleteTarget = ref<SeniorityList | null>(null)

function confirmDelete(list: SeniorityList) {
  deleteTarget.value = list
  deleteOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return

  deleting.value = deleteTarget.value.id
  try {
    await seniorityStore.deleteList(deleteTarget.value.id)
    toast.add({ title: 'List deleted', color: 'success' })
    deleteOpen.value = false
  }
  catch {
    toast.add({ title: 'Failed to delete list', color: 'error' })
  }
  finally {
    deleting.value = null
  }
}

// --- Init ---
onMounted(async () => {
  if (!seniorityStore.lists.length) {
    await seniorityStore.fetchLists()
  }
})
</script>
