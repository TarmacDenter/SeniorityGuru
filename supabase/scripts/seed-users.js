// supabase/scripts/seed-users.js
// Dev-only: creates test auth users + profiles.
// Usage (standalone): node --env-file=.env supabase/scripts/seed-users.js
// Also imported by seed-dev.js

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? ''
if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
  console.error('ERROR: seed-users.js must not be run against a remote Supabase instance.')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const ADMIN_ID    = '00000000-0000-0000-0000-000000000001'
export const DAL_USER_ID = '00000000-0000-0000-0000-000000000002'
export const UAL_USER_ID = '00000000-0000-0000-0000-000000000003'

const AUTH_USERS = [
  {
    id: ADMIN_ID,
    email: 'admin@test.local',
    password: 'admin1234',
    email_confirm: true,
    user_metadata: { email_verified: true },
  },
  {
    id: DAL_USER_ID,
    email: 'test@test.com',
    password: 'password',
    email_confirm: true,
    user_metadata: { email_verified: true },
  },
  {
    id: UAL_USER_ID,
    email: 'ual-user@test.local',
    password: 'password',
    email_confirm: true,
    user_metadata: { email_verified: true },
  },
  {
    // No fixed UUID — tests email-confirm flow
    email: 'unverified@test.com',
    password: 'password',
    email_confirm: false,
    user_metadata: { email_verified: false },
  },
]

const PROFILES = [
  {
    id: ADMIN_ID,
    role: 'admin',
    icao_code: null,
    employee_number: 'EMP001',
  },
  {
    id: DAL_USER_ID,
    role: 'user',
    icao_code: 'DAL',
    employee_number: 'EMP0500',
  },
  {
    id: UAL_USER_ID,
    role: 'user',
    icao_code: 'UAL',
    employee_number: 'EMP0400',
  },
]

export async function seedUsers() {
  for (const user of AUTH_USERS) {
    const { error } = await supabase.auth.admin.createUser(user)
    if (error && !error.message.includes('already been registered')) {
      throw new Error(`User ${user.email}: ${error.message}`)
    }
  }

  const { error } = await supabase.from('profiles').upsert(PROFILES)
  if (error) throw new Error(`Profiles: ${error.message}`)

  console.log('  ✓ 4 users (admin, test@test.com, ual-user, unverified)')
}

// Run standalone
if (!process.env.SEED_IMPORTED) {
  console.log('Seeding users...')
  try {
    await seedUsers()
    console.log('Done!')
  } catch (err) {
    console.error(`\nSeed failed: ${err.message}`)
    process.exit(1)
  }
}
