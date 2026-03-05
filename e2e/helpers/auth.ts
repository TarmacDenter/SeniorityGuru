import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_KEY ?? ''

export interface TestSession {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  expires_at: number
  user: Record<string, unknown>
}

export const TEST_USERS = {
  admin: { email: 'admin@test.local', password: 'admin1234' },
  dalUser: { email: 'test@test.com', password: 'password' },
  ualUser: { email: 'ual-user@test.local', password: 'password' },
  unverified: { email: 'unverified@test.com', password: 'password' },
} as const

export async function getTestSession(
  user: keyof typeof TEST_USERS = 'dalUser'
): Promise<TestSession> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const creds = TEST_USERS[user]

  const { data, error } = await supabase.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  })

  if (error || !data.session) {
    throw new Error(
      `Auth failed for ${creds.email}: ${error?.message ?? 'no session returned'}`
    )
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    token_type: data.session.token_type,
    expires_in: data.session.expires_in,
    expires_at: data.session.expires_at!,
    user: data.session.user as unknown as Record<string, unknown>,
  }
}
