import { useUserStore } from '~/stores/user'

export function useSignOut() {
  const supabase = useSupabaseClient()
  const userStore = useUserStore()

  async function signOut() {
    await supabase.auth.signOut()
    userStore.clearProfile()
    navigateTo('/auth/login')
  }

  return { signOut }
}
