<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { LocalSeniorityList } from '~/utils/db'
import { sortableHeader } from '~/utils/sortableHeader'
import { useSeniorityLists } from '~/composables/seniority'

definePageMeta({
  layout: 'dashboard',
})

type SeniorityList = LocalSeniorityList

const { lists, listsLoading, listsError, fetchLists, deleteList: storeDeleteList, updateList: storeUpdateList } = useSeniorityLists()
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
  defaultSorting: [{ id: 'effectiveDate', desc: true }],
})

const columns: TableColumn<SeniorityList>[] = [
  { accessorKey: 'title', header: sortableHeader<SeniorityList>('Title') },
  { accessorKey: 'effectiveDate', header: sortableHeader<SeniorityList>('Effective Date') },
  {
    accessorKey: 'createdAt',
    header: sortableHeader<SeniorityList>('Uploaded'),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  { id: 'actions', header: '' },
]

// --- Edit ---
const editOpen = ref(false)
const saving = ref(false)
const editListId = ref<number | null>(null)
const editState = reactive({
  title: '',
  effectiveDate: '',
})

function openEdit(list: SeniorityList) {
  editListId.value = list.id ?? null
  editState.title = list.title ?? ''
  editState.effectiveDate = list.effectiveDate
  editOpen.value = true
}

async function saveEdit() {
  if (!editListId.value) return

  saving.value = true
  try {
    await storeUpdateList(editListId.value, {
      ...(editState.title && { title: editState.title }),
      effectiveDate: editState.effectiveDate,
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
const deleting = ref<number | null>(null)
const deleteTarget = ref<SeniorityList | null>(null)

function confirmDelete(list: SeniorityList) {
  deleteTarget.value = list
  deleteOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value?.id) return

  deleting.value = deleteTarget.value.id
  try {
    await storeDeleteList(deleteTarget.value.id)
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

// --- Dropdown ---
function getDropdownItems(list: SeniorityList): DropdownMenuItem[][] {
  return [[
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      onSelect: () => navigateTo({ path: '/dashboard', query: { list: String(list.id) } }),
    },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEdit(list),
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => confirmDelete(list),
    },
  ]]
}

// Mobile card list follows the same filter as the desktop table
const filteredLists = computed(() => {
  const q = globalFilter.value.trim().toLowerCase()
  if (!q) return lists.value
  return lists.value.filter(l =>
    (l.title ?? '').toLowerCase().includes(q) || l.effectiveDate.toLowerCase().includes(q),
  )
})

// --- Init ---
onMounted(async () => {
  await fetchLists()
})
</script>

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
        <UAlert v-if="listsError" icon="i-lucide-alert-triangle" color="error" :title="listsError" />

        <UInput
          v-model="globalFilter"
          icon="i-lucide-search"
          placeholder="Search lists..."
          class="max-w-sm"
        />

        <!-- Mobile: card list with dropdown actions -->
        <div class="sm:hidden divide-y divide-(--ui-border) border border-(--ui-border) rounded-lg">
          <div v-for="list in filteredLists" :key="list.id" class="flex items-center gap-3 px-4 py-3">
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ list.title || list.effectiveDate }}</p>
              <p class="text-sm text-muted">{{ list.effectiveDate }}</p>
            </div>
            <UDropdownMenu :items="getDropdownItems(list)">
              <UButton icon="i-lucide-ellipsis" variant="ghost" size="xs" />
            </UDropdownMenu>
          </div>
          <div v-if="lists.length === 0" class="px-4 py-8 text-center text-muted text-sm">
            No lists uploaded yet.
          </div>
          <div v-else-if="filteredLists.length === 0" class="px-4 py-8 text-center text-muted text-sm">
            No results for "{{ globalFilter }}"
          </div>
        </div>

        <!-- Desktop: full table -->
        <div class="hidden sm:block overflow-x-auto">
          <UTable
            ref="listsTable"
            v-model:global-filter="globalFilter"
            v-model:pagination="pagination"
            v-model:sorting="sorting"
            :data="lists"
            :columns="columns"
            :loading="listsLoading"
            :pagination-options="paginationOptions"
          >
            <template #actions-cell="{ row }">
              <div class="flex gap-1">
                <UButton
                  icon="i-lucide-layout-dashboard"
                  variant="ghost"
                  size="xs"
                  label="Dashboard"
                  @click="navigateTo({ path: '/dashboard', query: { list: String(row.original.id) } })"
                />
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
            <UForm :state="editState" class="space-y-4" @submit="saveEdit">
              <UFormField label="Title" name="title">
                <UInput v-model="editState.title" placeholder="Optional title" class="w-full" />
              </UFormField>
              <UFormField label="Effective Date" name="effectiveDate">
                <UInput v-model="editState.effectiveDate" type="date" class="w-full" />
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
              <strong>{{ deleteTarget?.effectiveDate }}</strong>?
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
