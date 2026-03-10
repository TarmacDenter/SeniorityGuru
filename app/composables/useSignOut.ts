export function useSignOut() {
  const supabase = useSupabaseClient()

  async function signOut() {
    await supabase.auth.signOut()
    navigateTo('/auth/login')
  }

  return { signOut }
}
