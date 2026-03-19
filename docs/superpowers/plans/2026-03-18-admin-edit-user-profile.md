# Admin Edit User Profile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to edit `icao_code`, `employee_number`, and `mandatory_retirement_age` on any user's profile via a modal on the admin user detail page.

**Architecture:** A new `PATCH /api/admin/users/[id]/profile` endpoint accepts partial profile updates (all three fields optional), validated via a new Zod schema. The admin user detail page gains an "Edit Profile" button that opens a `UModal` pre-filled from the current user data. A prerequisite step adds `mandatory_retirement_age` to the existing GET endpoint so the modal can pre-fill it.

**Tech Stack:** Nuxt 4, NuxtUI (`UModal`, `USelectMenu`, `UInput`, `UInputNumber`), Supabase service role client, Zod, Vitest + `@nuxt/test-utils`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/schemas/admin.ts` | Modify | Add `mandatory_retirement_age` to `AdminUserDetailSchema`; add `UpdateUserProfileSchema` |
| `server/api/admin/users/[id].get.ts` | Modify | Include `mandatory_retirement_age` in SELECT and response |
| `server/api/admin/users/[id].get.test.ts` | Modify | Update existing tests to include `mandatory_retirement_age` |
| `server/api/admin/users/[id]/profile.patch.ts` | Create | New PATCH endpoint for partial profile updates |
| `server/api/admin/users/[id]/profile.patch.test.ts` | Create | Endpoint unit tests |
| `app/pages/admin/users/[id].vue` | Modify | Add "Edit Profile" button + `UModal` with three fields |
| `app/pages/admin/users/[id].test.ts` | Modify | Add edit modal tests to the existing co-located test file |

---

## Task 1: Extend AdminUserDetailSchema and GET endpoint with mandatory_retirement_age

**Files:**
- Modify: `shared/schemas/admin.ts`
- Modify: `server/api/admin/users/[id].get.ts`
- Modify: `server/api/admin/users/[id].get.test.ts`

The admin user detail page currently has no way to pre-fill `mandatory_retirement_age` in the modal because the GET endpoint never fetches it. The DB column is `NOT NULL` with a default of 65, so it will never be null. Fix this first so subsequent tasks can rely on it.

- [ ] **Step 1: Update the existing test to expect `mandatory_retirement_age`**

Open `server/api/admin/users/[id].get.test.ts`. In the test `'returns merged user detail from auth and profile'`, add `mandatory_retirement_age: 65` to `fakeProfile` and add it to the `expect.objectContaining(...)` assertion:

```typescript
const fakeProfile = {
  role: 'user',
  icao_code: 'UAL',
  employee_number: 'E001',
  mandatory_retirement_age: 65,  // ADD THIS
}

// In the parseResponse expect:
expect(mocks.parseResponse).toHaveBeenCalledWith(
  'AdminUserDetailSchema',
  expect.objectContaining({
    id: fakeUserId,
    email: 'alice@example.com',
    role: 'user',
    icao_code: 'UAL',
    employee_number: 'E001',
    mandatory_retirement_age: 65,  // ADD THIS
  }),
  'admin/users/[id].get',
)
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- server/api/admin/users/\\[id\\].get.test.ts
```

Expected: FAIL — the test asserts `mandatory_retirement_age` is passed to `parseResponse` but the endpoint doesn't fetch or return it yet.

- [ ] **Step 3: Update `AdminUserDetailSchema` in `shared/schemas/admin.ts`**

Add `mandatory_retirement_age` to the schema (non-nullable — the DB column has `NOT NULL DEFAULT 65`):

```typescript
export const AdminUserDetailSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  created_at: z.string(),
  last_sign_in_at: z.string().nullable(),
  role: z.enum(['user', 'admin', 'moderator']),
  icao_code: z.string().nullable(),
  employee_number: z.string().nullable(),
  mandatory_retirement_age: z.number().int(),  // ADD THIS — NOT NULL in DB
})
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>
```

- [ ] **Step 4: Update the GET endpoint to fetch and return the field**

In `server/api/admin/users/[id].get.ts`, change the SELECT string and the `parseResponse` call:

```typescript
// Change SELECT:
const { data: profile, error: profileError } = await client
  .from('profiles')
  .select('role, icao_code, employee_number, mandatory_retirement_age')  // add field
  .eq('id', id)
  .single()

// Change parseResponse call:
return parseResponse(AdminUserDetailSchema, {
  id: authUser.id,
  email: authUser.email ?? null,
  created_at: authUser.created_at,
  last_sign_in_at: authUser.last_sign_in_at ?? null,
  role: profile?.role ?? 'user',
  icao_code: profile?.icao_code ?? null,
  employee_number: profile?.employee_number ?? null,
  mandatory_retirement_age: profile?.mandatory_retirement_age ?? 65,  // ADD THIS
}, 'admin/users/[id].get')
```

- [ ] **Step 5: Run the tests and verify they pass**

```bash
npm test -- server/api/admin/users/\\[id\\].get.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add shared/schemas/admin.ts server/api/admin/users/\[id\].get.ts server/api/admin/users/\[id\].get.test.ts
git commit -m "feat(admin): include mandatory_retirement_age in user detail response"
```

---

## Task 2: Add UpdateUserProfileSchema

**Files:**
- Modify: `shared/schemas/admin.ts`
- Create: `shared/schemas/admin.test.ts`

All three fields are optional to support partial updates. A `.refine` guard rejects empty bodies. Max retirement age is 75 to match the existing `UpdatePreferencesSchema` in `shared/schemas/settings.ts`.

- [ ] **Step 1: Write failing schema tests**

Open the existing `shared/schemas/admin.test.ts` (it already exists — do NOT overwrite it). Add a new `describe` block for `UpdateUserProfileSchema`:

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { UpdateUserProfileSchema } from './admin'

describe('UpdateUserProfileSchema', () => {
  it('accepts a valid full update', () => {
    const result = UpdateUserProfileSchema.safeParse({
      icaoCode: 'DAL',
      employeeNumber: '12345',
      mandatoryRetirementAge: 65,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a partial update with only icaoCode', () => {
    const result = UpdateUserProfileSchema.safeParse({ icaoCode: 'UAL' })
    expect(result.success).toBe(true)
  })

  it('accepts null icaoCode to clear the airline', () => {
    const result = UpdateUserProfileSchema.safeParse({ icaoCode: null })
    expect(result.success).toBe(true)
  })

  it('accepts null employeeNumber to clear it', () => {
    const result = UpdateUserProfileSchema.safeParse({ employeeNumber: null })
    expect(result.success).toBe(true)
  })

  it('rejects an empty body', () => {
    const result = UpdateUserProfileSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects icaoCode that is too short', () => {
    const result = UpdateUserProfileSchema.safeParse({ icaoCode: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects icaoCode that is too long', () => {
    const result = UpdateUserProfileSchema.safeParse({ icaoCode: 'ABCDE' })
    expect(result.success).toBe(false)
  })

  it('rejects mandatoryRetirementAge below 55', () => {
    const result = UpdateUserProfileSchema.safeParse({ mandatoryRetirementAge: 40 })
    expect(result.success).toBe(false)
  })

  it('rejects mandatoryRetirementAge above 75', () => {
    const result = UpdateUserProfileSchema.safeParse({ mandatoryRetirementAge: 80 })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- shared/schemas/admin.test.ts
```

Expected: FAIL — `UpdateUserProfileSchema` is not yet exported from `admin.ts`.

- [ ] **Step 3: Add `UpdateUserProfileSchema` to `shared/schemas/admin.ts`**

Add after `UpdateUserRoleSchema`:

```typescript
export const UpdateUserProfileSchema = z.object({
  icaoCode: z.string().min(2).max(4).nullable().optional(),
  employeeNumber: z.string().max(20).nullable().optional(),
  mandatoryRetirementAge: z.number().int().min(55).max(75).optional(),
}).refine(
  data => Object.values(data).some(v => v !== undefined),
  { message: 'At least one field is required' },
)
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- shared/schemas/admin.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/schemas/admin.ts shared/schemas/admin.test.ts
git commit -m "feat(admin): add UpdateUserProfileSchema for partial profile updates"
```

---

## Task 3: Create the PATCH /api/admin/users/[id]/profile endpoint

**Files:**
- Create: `server/api/admin/users/[id]/profile.patch.ts`
- Create: `server/api/admin/users/[id]/profile.patch.test.ts`

Note: `[id]/` is a subdirectory alongside the existing `[id].get.ts` / `[id].patch.ts` files. In Nuxt file-based routing this maps to `PATCH /api/admin/users/:id/profile`. `requireAdmin`, `validateBody`, `validateRouteParam`, `createError`, and `defineEventHandler` are Nitro auto-imports — do NOT add explicit imports for them.

- [ ] **Step 1: Write the failing endpoint tests**

Create `server/api/admin/users/[id]/profile.patch.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

const { mocks, mockLogger } = vi.hoisted(() => {
  const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  return {
    mockLogger: logger,
    mocks: {
      requireAdmin: vi.fn(),
      validateRouteParam: vi.fn(),
      validateBody: vi.fn(),
      serverSupabaseServiceRole: vi.fn(),
    },
  }
})

Object.assign(globalThis, {
  defineEventHandler: (fn: Function) => fn,
  createError: (opts: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts),
  requireAdmin: mocks.requireAdmin,
  validateRouteParam: mocks.validateRouteParam,
  validateBody: mocks.validateBody,
})

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('~~/shared/schemas/admin', () => ({
  UpdateUserProfileSchema: 'UpdateUserProfileSchema',
  AdminUserIdSchema: 'AdminUserIdSchema',
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

describe('PATCH /api/admin/users/[id]/profile', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown
  const fakeAdminId = 'admin-uuid-1234'
  const fakeUserId = 'user-uuid-5678'

  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.update = vi.fn(() => mockClient)
  mockClient.eq = vi.fn(() => mockClient)
  mockClient.select = vi.fn(() => mockClient)
  mockClient.single = vi.fn()

  beforeAll(async () => {
    const mod = await import('./profile.patch')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.serverSupabaseServiceRole.mockReturnValue(mockClient)
    mockClient.from.mockReturnValue(mockClient)
    mockClient.update.mockReturnValue(mockClient)
    mockClient.eq.mockReturnValue(mockClient)
    mockClient.select.mockReturnValue(mockClient)
  })

  it('rejects non-admin callers with 403', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      Object.assign(new Error('Forbidden'), { statusCode: 403 }),
    )
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects invalid user id with 422', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockRejectedValueOnce(
      Object.assign(new Error('Invalid id'), { statusCode: 422 }),
    )
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects empty body with 422', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockRejectedValueOnce(
      Object.assign(new Error('At least one field is required'), { statusCode: 422 }),
    )
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('updates only the fields present in the body', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({ icaoCode: 'DAL' }) // partial — only icaoCode

    const updatedProfile = {
      id: fakeUserId,
      icao_code: 'DAL',
      employee_number: '12345',
      mandatory_retirement_age: 65,
    }
    mockClient.single.mockResolvedValueOnce({ data: updatedProfile, error: null })

    const result = await handler(fakeEvent)

    // Must only pass icao_code to .update(), not employee_number or mandatory_retirement_age
    expect(mockClient.update).toHaveBeenCalledWith({ icao_code: 'DAL' })
    expect(mockClient.eq).toHaveBeenCalledWith('id', fakeUserId)
    expect(result).toEqual(updatedProfile)
  })

  it('updates all fields when all are provided', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({
      icaoCode: 'UAL',
      employeeNumber: '99999',
      mandatoryRetirementAge: 60,
    })

    const updatedProfile = {
      id: fakeUserId,
      icao_code: 'UAL',
      employee_number: '99999',
      mandatory_retirement_age: 60,
    }
    mockClient.single.mockResolvedValueOnce({ data: updatedProfile, error: null })

    await handler(fakeEvent)

    expect(mockClient.update).toHaveBeenCalledWith({
      icao_code: 'UAL',
      employee_number: '99999',
      mandatory_retirement_age: 60,
    })
  })

  it('allows setting icaoCode to null to clear the airline', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({ icaoCode: null })

    const updatedProfile = {
      id: fakeUserId,
      icao_code: null,
      employee_number: null,
      mandatory_retirement_age: 65,
    }
    mockClient.single.mockResolvedValueOnce({ data: updatedProfile, error: null })

    await handler(fakeEvent)
    expect(mockClient.update).toHaveBeenCalledWith({ icao_code: null })
  })

  it('returns 404 when user profile not found', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({ icaoCode: 'DAL' })
    mockClient.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'No rows', code: 'PGRST116' },
    })

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 500 on unexpected DB error', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({ icaoCode: 'DAL' })
    mockClient.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error', code: 'UNEXPECTED' },
    })

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 500 })
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- "server/api/admin/users/\[id\]/profile.patch.test.ts"
```

Expected: FAIL — `./profile.patch` module does not exist yet.

- [ ] **Step 3: Create the endpoint**

Create `server/api/admin/users/[id]/profile.patch.ts`:

```typescript
import { serverSupabaseServiceRole } from '#supabase/server'
import { UpdateUserProfileSchema, AdminUserIdSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'

const log = createAdminLogger('users/profile/patch')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { id } = await validateRouteParam(event, 'id', AdminUserIdSchema)
  const body = await validateBody(event, UpdateUserProfileSchema)

  // Build partial update — only include fields that were explicitly provided
  const updates: Record<string, unknown> = {}
  if (body.icaoCode !== undefined) updates.icao_code = body.icaoCode
  if (body.employeeNumber !== undefined) updates.employee_number = body.employeeNumber
  if (body.mandatoryRetirementAge !== undefined) updates.mandatory_retirement_age = body.mandatoryRetirementAge

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id, icao_code, employee_number, mandatory_retirement_age')
    .single()

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }
    log.error('Failed to update profile', { targetId: id, error: error?.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to update profile' })
  }

  log.info('User profile updated', {
    adminId: admin.sub,
    targetId: id,
    fields: Object.keys(updates),
  })
  return data
})
```

- [ ] **Step 4: Run the tests and verify they pass**

```bash
npm test -- "server/api/admin/users/\[id\]/profile.patch.test.ts"
```

Expected: All tests PASS.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add "server/api/admin/users/[id]/profile.patch.ts" "server/api/admin/users/[id]/profile.patch.test.ts"
git commit -m "feat(admin): add PATCH /api/admin/users/[id]/profile endpoint"
```

---

## Task 4: Add Edit Profile modal to admin user detail page

**Files:**
- Modify: `app/pages/admin/users/[id].vue`
- Modify: `app/pages/admin/users/[id].test.ts` (add to the existing co-located test file — do NOT create a new file)

The Profile Card header gets an "Edit Profile" button. A `UModal` contains the three editable fields. On save it calls the new endpoint and patches the local `user` ref. The `saveProfile` function is exposed via `defineExpose` so it can be tested directly without needing to intercept `$fetch` at the module level.

- [ ] **Step 1: Add new tests to the existing test file**

Open `app/pages/admin/users/[id].test.ts`. The existing `mockUser` object needs `mandatory_retirement_age` added to it (required by Task 1's schema change). Then add new tests inside the existing `describe` block.

**1a. Update `mockUser`** — add `mandatory_retirement_age: 65`:

```typescript
const mockUser = {
  id: 'user-abc',
  email: 'alice@example.com',
  created_at: '2026-01-01T00:00:00Z',
  last_sign_in_at: '2026-01-10T08:00:00Z',
  role: 'user',
  icao_code: 'DAL',
  employee_number: '12345',
  mandatory_retirement_age: 65,  // ADD THIS
}
```

**1b. Add `mockFetch` to the hoisted block** — add it alongside the existing hoisted mocks and add a `mockNuxtImport` call for `useAirlineOptions`:

```typescript
const { mockUseFetch, mockNavigateTo, mockRouteParams, mockFetch } = vi.hoisted(() => ({
  mockUseFetch: vi.fn(),
  mockNavigateTo: vi.fn(),
  mockRouteParams: { value: { id: 'user-abc' } },
  mockFetch: vi.fn(),  // ADD THIS
}))

// ADD THIS after the existing mockNuxtImport calls:
mockNuxtImport('useAirlineOptions', () => () => ({
  options: ref([{ label: 'Delta Air Lines (DAL)', value: 'DAL' }]),
  loading: ref(false),
  load: vi.fn(),
}))
```

**1c. Stub `$fetch` globally in `beforeEach`** — `$fetch` is a Nuxt global, not a composable, so stub it via `vi.stubGlobal`:

```typescript
beforeEach(() => {
  mockUseFetch.mockReset()
  mockNavigateTo.mockReset()
  mockFetch.mockReset()
  vi.stubGlobal('$fetch', mockFetch)  // ADD THIS LINE

  mockUseFetch.mockImplementation((url: string) => {
    // ... existing implementation unchanged
  })
})
```

**1d. Add the new edit modal tests** inside the existing `describe` block, after the existing tests:

```typescript
it('renders an "Edit Profile" button in the Profile Card', async () => {
  const UserDetailPage = await import('./[id].vue')
  const wrapper = await mountSuspended(UserDetailPage.default)
  expect(wrapper.text()).toContain('Edit Profile')
})

it('saveProfile calls PATCH endpoint with the provided fields', async () => {
  mockFetch.mockResolvedValueOnce({
    id: 'user-abc',
    icao_code: 'UAL',
    employee_number: '12345',
    mandatory_retirement_age: 65,
  })

  const UserDetailPage = await import('./[id].vue')
  const wrapper = await mountSuspended(UserDetailPage.default)
  const vm = wrapper.vm as unknown as { saveProfile: (p: Record<string, unknown>) => Promise<void> }

  await vm.saveProfile({ icaoCode: 'UAL' })

  expect(mockFetch).toHaveBeenCalledWith(
    '/api/admin/users/user-abc/profile',
    expect.objectContaining({ method: 'PATCH', body: { icaoCode: 'UAL' } }),
  )
})

it('saveProfile patches local user ref on success', async () => {
  mockFetch.mockResolvedValueOnce({
    id: 'user-abc',
    icao_code: 'UAL',
    employee_number: '99',
    mandatory_retirement_age: 60,
  })

  const UserDetailPage = await import('./[id].vue')
  const wrapper = await mountSuspended(UserDetailPage.default)
  const vm = wrapper.vm as unknown as {
    saveProfile: (p: Record<string, unknown>) => Promise<void>
    $data: Record<string, unknown>
  }

  await vm.saveProfile({ icaoCode: 'UAL', employeeNumber: '99', mandatoryRetirementAge: 60 })
  await nextTick()

  // The profile card should reflect updated values
  expect(wrapper.text()).toContain('UAL')
})
```

- [ ] **Step 2: Run the existing tests to confirm the new assertions fail**

```bash
npm test -- "app/pages/admin/users/\[id\].test.ts"
```

Expected: Existing tests still pass. New tests FAIL — "Edit Profile" button and `saveProfile` don't exist yet.

- [ ] **Step 3: Update the component — script setup**

Open `app/pages/admin/users/[id].vue`. Add the following after the existing composable/ref declarations in `<script setup>`:

```typescript
// Airline options for the edit modal
const { options: airlineOptions, loading: airlinesLoading, load: loadAirlines } = useAirlineOptions()

// Edit profile modal state
const editProfileOpen = ref(false)
const editProfileLoading = ref(false)
const editProfileForm = ref({
  icaoCode: user.value?.icao_code ?? null as string | null,
  employeeNumber: user.value?.employee_number ?? null as string | null,
  mandatoryRetirementAge: user.value?.mandatory_retirement_age ?? 65,
})

function openEditProfile() {
  editProfileForm.value = {
    icaoCode: user.value?.icao_code ?? null,
    employeeNumber: user.value?.employee_number ?? null,
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
```

Then **replace** the existing `defineExpose` call (there is only one — do not add a second one):

```typescript
// Replace this:
defineExpose({ confirmDelete, deleteOpen })

// With this:
defineExpose({ confirmDelete, deleteOpen, saveProfile })
```

- [ ] **Step 4: Update the component — Profile Card header**

Replace the existing Profile Card `<template #header>`:

```vue
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
```

- [ ] **Step 5: Add the Edit Profile modal to the template**

Add the following modal inside the `<template #body>` section, after the existing Delete List modal:

```vue
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
```

- [ ] **Step 6: Run the component tests**

```bash
npm test -- "app/pages/admin/users/\[id\].test.ts"
```

Expected: All tests PASS.

- [ ] **Step 7: Run the full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 8: Run typecheck**

```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 9: Commit**

```bash
git add "app/pages/admin/users/[id].vue" "app/pages/admin/users/[id].test.ts"
git commit -m "feat(admin): add Edit Profile modal to admin user detail page (#38)"
```

---

## Final Verification

- [ ] Start the dev server and local Supabase: `npm run dev` + `npm run db:start`
- [ ] Log in as an admin user
- [ ] Navigate to a user with no airline code set (`/admin/users/<id>`)
- [ ] Click "Edit Profile" — modal opens with empty airline, current employee number and retirement age pre-filled
- [ ] Select an airline, click Save — profile card updates inline, toast shows "Profile updated"
- [ ] Click "Upload for this user" — upload proceeds without the 400 "No airline set on profile" error
- [ ] Navigate back to the user detail — airline code is now shown in the profile card
