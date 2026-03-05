import type { Database } from '#shared/types/database'

// Typed wrappers around @nuxtjs/supabase composables
export const useDb = () => useSupabaseClient<Database>()
