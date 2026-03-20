<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()

const modalOpen = ref(false)
const confirmInput = ref('')
const loading = ref(false)

const confirmMatches = computed(() => confirmInput.value === 'DELETE')

async function deleteAccount() {
  loading.value = true
  try {
    await $fetch('/api/account', { method: 'DELETE' })
    await supabase.auth.signOut()
    await navigateTo('/auth/login')
  }
  catch {
    toast.add({
      title: 'Failed to delete account',
      description: 'Something went wrong. Please try again or contact support.',
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

defineExpose({ modalOpen, confirmInput, deleteAccount })
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-(--ui-error)">Danger Zone</h2>
    </template>

    <div class="space-y-3">
      <p class="text-sm text-(--ui-text-muted)">
        Permanently delete your account and all uploaded seniority lists. This cannot be undone.
      </p>
      <UButton color="error" variant="outline" @click="modalOpen = true">
        Delete account
      </UButton>
    </div>

    <UModal v-model:open="modalOpen" title="Delete your account?">
      <template #body>
        <div class="space-y-4">
          <UAlert
            color="error"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="This is permanent"
            description="All your seniority lists and data will be deleted and cannot be recovered."
          />

          <p class="text-sm">
            Signed in as <span class="font-semibold">{{ user?.email }}</span>
          </p>

          <UFormField :label="`Type DELETE to confirm`" name="confirmInput">
            <UInput
              v-model="confirmInput"
              placeholder="DELETE"
              class="w-full font-mono"
              autocomplete="off"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="modalOpen = false; confirmInput = ''">
            Cancel
          </UButton>
          <UButton
            color="error"
            :disabled="!confirmMatches"
            :loading="loading"
            @click="deleteAccount"
          >
            Delete my account
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
