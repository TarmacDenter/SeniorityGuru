# User Settings Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/settings` page where users can edit their profile, customize retirement age, and change their password.

**Architecture:** Single page at `/settings` using the `seniority` layout with three independent `UForm` sections (Profile, Preferences, Security). Each form has its own Zod schema, save button, and Supabase update logic. TDD — schema tests first, then implementation.

**Tech Stack:** Nuxt 4, Nuxt UI v4 (`UForm`/`UFormField`/`UCard`/`USelectMenu`/`UInput`), Zod, Supabase JS client, Pinia (`useUserStore`)

**Design doc:** `docs/plans/2026-03-06-user-settings-design.md`

---

### Task 1: Settings Schemas — Tests

**Files:**
- Create: `shared/schemas/settings.test.ts`

**Step 1: Write the failing tests**

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { UpdateProfileSchema, UpdatePreferencesSchema, ChangePasswordSchema } from './settings'

describe('UpdateProfileSchema', () => {
  it('accepts valid profile data', () => {
    const result = UpdateProfileSchema.safeParse({ icaoCode: 'UAL', employeeNumber: '12345' })
    expect(result.success).toBe(true)
  })

  it('accepts empty employee number', () => {
    const result = UpdateProfileSchema.safeParse({ icaoCode: 'UAL', employeeNumber: '' })
    expect(result.success).toBe(true)
  })

  it('rejects icaoCode shorter than 2 chars', () => {
    const result = UpdateProfileSchema.safeParse({ icaoCode: 'U', employeeNumber: '' })
    expect(result.success).toBe(false)
  })

  it('rejects employee number longer than 20 chars', () => {
    const result = UpdateProfileSchema.safeParse({ icaoCode: 'UAL', employeeNumber: 'A'.repeat(21) })
    expect(result.success).toBe(false)
  })
})

describe('UpdatePreferencesSchema', () => {
  it('accepts age 65', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 65 })
    expect(result.success).toBe(true)
  })

  it('accepts age 55 (minimum)', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 55 })
    expect(result.success).toBe(true)
  })

  it('accepts age 75 (maximum)', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 75 })
    expect(result.success).toBe(true)
  })

  it('rejects age below 55', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 54 })
    expect(result.success).toBe(false)
  })

  it('rejects age above 75', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 76 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 65.5 })
    expect(result.success).toBe(false)
  })
})

describe('ChangePasswordSchema', () => {
  it('accepts matching passwords with valid current password', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      password: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      password: 'newpass123',
      confirmPassword: 'different1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPassword')
    }
  })

  it('rejects password shorter than 8 chars', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects current password shorter than 8 chars', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'short',
      password: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- shared/schemas/settings.test.ts`
Expected: FAIL — cannot find module `./settings`

---

### Task 2: Settings Schemas — Implementation

**Files:**
- Create: `shared/schemas/settings.ts`

**Step 1: Implement the schemas**

```ts
import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  icaoCode: z.string().min(2, 'Please select your airline'),
  employeeNumber: z.string().max(20, 'Employee number is too long'),
})
export type UpdateProfileState = z.infer<typeof UpdateProfileSchema>

export const UpdatePreferencesSchema = z.object({
  mandatoryRetirementAge: z.number().int('Must be a whole number').min(55, 'Minimum age is 55').max(75, 'Maximum age is 75'),
})
export type UpdatePreferencesState = z.infer<typeof UpdatePreferencesSchema>

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
})
export type ChangePasswordState = z.infer<typeof ChangePasswordSchema>
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- shared/schemas/settings.test.ts`
Expected: All 12 tests PASS

**Step 3: Commit**

```bash
git add shared/schemas/settings.ts shared/schemas/settings.test.ts
git commit -m "feat(settings): add Zod schemas for profile, preferences, and password"
```

---

### Task 3: Add Settings Nav Item

**Files:**
- Modify: `app/composables/useSeniorityNav.ts:4-7`

**Step 1: Add the settings nav item**

Add after the Upload entry (line 6):

```ts
{ label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
```

Full file should be:

```ts
import type { NavigationMenuItem } from '@nuxt/ui'

export function useSeniorityNav(): NavigationMenuItem[] {
  return [
    { label: 'Dashboard',      icon: 'i-lucide-layout-dashboard', to: '/' },
    { label: 'Upload',         icon: 'i-lucide-upload',           to: '/seniority/upload' },
    { label: 'Settings',       icon: 'i-lucide-settings',         to: '/settings' },
  ]
}
```

**Step 2: Add CSR route rule for `/settings`**

In `nuxt.config.ts`, add to `routeRules` (line 31-33):

```ts
'/settings': { ssr: false },
```

**Step 3: Commit**

```bash
git add app/composables/useSeniorityNav.ts nuxt.config.ts
git commit -m "feat(settings): add settings nav item and CSR route rule"
```

---

### Task 4: Settings Page — Profile Section

**Files:**
- Create: `app/pages/settings.vue`

**Step 1: Create the settings page with Profile section**

```vue
<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold">Settings</h1>

    <!-- Profile -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Profile</h2>
      </template>

      <UForm :schema="UpdateProfileSchema" :state="profileState" class="space-y-4" @submit="onSaveProfile">
        <UFormField label="Airline" name="icaoCode">
          <USelectMenu
            v-model="profileState.icaoCode"
            :items="airlineOptions"
            value-key="value"
            placeholder="Search airlines..."
            :loading="airlinesLoading"
            :search-input="{ placeholder: 'Search by name...' }"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Employee Number" name="employeeNumber">
          <UInput v-model="profileState.employeeNumber" placeholder="e.g. 12345" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="profileLoading">Save profile</UButton>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { UpdateProfileSchema } from '#shared/schemas/settings'
import type { UpdateProfileState } from '#shared/schemas/settings'
import { normalizeEmployeeNumber } from '#shared/schemas/seniority-list'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: 'seniority', middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const userStore = useUserStore()

// Load airline options
const { options: airlineOptions, loading: airlinesLoading, load: loadAirlines } = useAirlineOptions()
await loadAirlines()

// Profile form
const profileLoading = ref(false)
const profileState = reactive<UpdateProfileState>({
  icaoCode: userStore.profile?.icao_code ?? '',
  employeeNumber: userStore.profile?.employee_number ?? '',
})

async function onSaveProfile() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  profileLoading.value = true
  const normalized = profileState.employeeNumber
    ? normalizeEmployeeNumber(profileState.employeeNumber)
    : ''
  const { error } = await supabase
    .from('profiles')
    .update({
      icao_code: profileState.icaoCode,
      employee_number: normalized || null,
    })
    .eq('id', userId)
  profileLoading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await userStore.fetchProfile()
  toast.add({ title: 'Profile saved', color: 'success' })
}
</script>
```

**Step 2: Verify manually**

Run: `npm run dev` — navigate to `/settings`
Expected: Profile card renders with airline dropdown and employee number input pre-populated from user store

**Step 3: Commit**

```bash
git add app/pages/settings.vue
git commit -m "feat(settings): add settings page with profile section"
```

---

### Task 5: Settings Page — Preferences Section

**Files:**
- Modify: `app/pages/settings.vue`

**Step 1: Add the Preferences card below the Profile card**

Add after the Profile `</UCard>` closing tag in the template:

```vue
    <!-- Preferences -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Preferences</h2>
      </template>

      <UForm :schema="UpdatePreferencesSchema" :state="prefsState" class="space-y-4" @submit="onSavePrefs">
        <UFormField label="Mandatory Retirement Age" name="mandatoryRetirementAge" hint="Affects all seniority projections">
          <UInput v-model.number="prefsState.mandatoryRetirementAge" type="number" :min="55" :max="75" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="prefsLoading">Save preferences</UButton>
      </UForm>
    </UCard>
```

Add imports and state in `<script setup>`:

```ts
import { UpdateProfileSchema, UpdatePreferencesSchema } from '#shared/schemas/settings'
import type { UpdateProfileState, UpdatePreferencesState } from '#shared/schemas/settings'

// Preferences form
const prefsLoading = ref(false)
const prefsState = reactive<UpdatePreferencesState>({
  mandatoryRetirementAge: userStore.profile?.mandatory_retirement_age ?? 65,
})

async function onSavePrefs() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  prefsLoading.value = true
  const { error } = await supabase
    .from('profiles')
    .update({ mandatory_retirement_age: prefsState.mandatoryRetirementAge })
    .eq('id', userId)
  prefsLoading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await userStore.fetchProfile()
  toast.add({ title: 'Preferences saved', color: 'success' })
}
```

**Step 2: Verify manually**

Run: `npm run dev` — navigate to `/settings`
Expected: Preferences card renders below Profile with retirement age input defaulting to 65

**Step 3: Commit**

```bash
git add app/pages/settings.vue
git commit -m "feat(settings): add preferences section with retirement age"
```

---

### Task 6: Settings Page — Security Section

**Files:**
- Modify: `app/pages/settings.vue`

**Step 1: Add the Security card below the Preferences card**

Add after the Preferences `</UCard>` closing tag in the template:

```vue
    <!-- Security -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Security</h2>
      </template>

      <UForm :schema="ChangePasswordSchema" :state="passwordState" class="space-y-4" @submit="onChangePassword">
        <UFormField label="Current password" name="currentPassword">
          <UInput v-model="passwordState.currentPassword" type="password" class="w-full" />
        </UFormField>
        <UFormField label="New password" name="password">
          <UInput v-model="passwordState.password" type="password" class="w-full" />
        </UFormField>
        <UFormField label="Confirm new password" name="confirmPassword">
          <UInput v-model="passwordState.confirmPassword" type="password" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="passwordLoading">Change password</UButton>
      </UForm>
    </UCard>
```

Add imports and state in `<script setup>`:

```ts
import { UpdateProfileSchema, UpdatePreferencesSchema, ChangePasswordSchema } from '#shared/schemas/settings'
import type { UpdateProfileState, UpdatePreferencesState, ChangePasswordState } from '#shared/schemas/settings'

// Password form
const passwordLoading = ref(false)
const passwordState = reactive<ChangePasswordState>({
  currentPassword: '',
  password: '',
  confirmPassword: '',
})

async function onChangePassword() {
  const email = user.value?.email
  if (!email) return

  passwordLoading.value = true

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: passwordState.currentPassword,
  })

  if (signInError) {
    passwordLoading.value = false
    toast.add({ title: 'Current password is incorrect', color: 'error' })
    return
  }

  // Update to new password
  const { error } = await supabase.auth.updateUser({ password: passwordState.password })
  passwordLoading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  passwordState.currentPassword = ''
  passwordState.password = ''
  passwordState.confirmPassword = ''
  toast.add({ title: 'Password changed', color: 'success' })
}
```

**Step 2: Verify manually**

Run: `npm run dev` — navigate to `/settings`
Expected: Security card renders with three password fields. Submitting with wrong current password shows error toast.

**Step 3: Commit**

```bash
git add app/pages/settings.vue
git commit -m "feat(settings): add security section with password change"
```

---

### Task 7: Run Tests & Typecheck

**Step 1: Run schema tests**

Run: `npm test -- shared/schemas/settings.test.ts`
Expected: All 12 tests PASS

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests PASS (no regressions)

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: No type errors

---

### Task 8: Final Verification

**Step 1: Manual smoke test**

Run: `npm run dev` and test:
1. Navigate to `/settings` from sidebar — Settings link visible
2. Profile section: change airline, change employee number, save — toast appears, profile refreshes
3. Preferences section: change retirement age, save — toast appears
4. Security section: enter wrong current password — error toast. Enter correct current password + new password — success toast, fields clear
5. Navigate to dashboard — projections should reflect updated retirement age

**Step 2: Commit any final fixes if needed**
