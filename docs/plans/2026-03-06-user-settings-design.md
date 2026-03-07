# User Settings Page — Design

## Problem

Users have no way to edit their profile (airline, employee number), customize preferences (retirement age), or change their password after initial setup. The `EmployeeNumberBanner` on the dashboard is the only edit surface, and retirement age has no UI at all despite being stored in the DB.

## Design

### Route & Layout

- **Route:** `/settings`
- **Layout:** `seniority` (sidebar + navbar)
- **Middleware:** `auth`
- **SSR:** `false` (CSR-only, matching `/seniority/*` pattern)

### Page Structure

Single page with three `UCard` sections stacked vertically. Each section has its own `UForm` with independent Zod validation and save button.

#### 1. Profile

| Field | Component | Source |
|---|---|---|
| Airline | `USelectMenu` via `useAirlineOptions()` | `profile.icao_code` |
| Employee Number | `UInput` (text, max 20) | `profile.employee_number` |

- Save: `supabase.from('profiles').update({ icao_code, employee_number }).eq('id', user.sub)`
- Post-save: `userStore.fetchProfile()` + success toast

#### 2. Preferences

| Field | Component | Source |
|---|---|---|
| Mandatory Retirement Age | `UInput` (number, 55-75) | `profile.mandatory_retirement_age` |

- Save: same pattern as Profile
- Note: changing this affects all dashboard projections

#### 3. Security

| Field | Component |
|---|---|
| Current Password | `UInput` (password) |
| New Password | `UInput` (password, min 8) |
| Confirm New Password | `UInput` (password) |

- Verify current password: `supabase.auth.signInWithPassword({ email, password: currentPassword })`
- Update: `supabase.auth.updateUser({ password: newPassword })`
- Post-save: clear form + success toast

### Schemas

New file: `shared/schemas/settings.ts`

- `UpdateProfileSchema` — icaoCode (string, min 2), employeeNumber (string, 1-20 chars, optional)
- `UpdatePreferencesSchema` — mandatoryRetirementAge (number, 55-75)
- `ChangePasswordSchema` — currentPassword (string, min 8), password (string, min 8), confirmPassword (string) + refine for match

### Navigation

Add to `useSeniorityNav()`:
```ts
{ label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
```

### Reused Code

- `useAirlineOptions()` — `app/composables/useAirlineOptions.ts`
- `useUserStore()` — `app/stores/user.ts`
- `useDb()` — `app/composables/useSupabase.ts`
- Form patterns from `app/pages/auth/setup-profile.vue`
- Password update pattern from `app/pages/auth/update-password.vue`

### Files to Create/Modify

- **Create:** `shared/schemas/settings.ts`
- **Create:** `app/pages/settings.vue`
- **Modify:** `app/composables/useSeniorityNav.ts` (add settings nav item)

### Testing

- Schema tests: `shared/schemas/settings.test.ts` (Zod validation, `@vitest-environment node`)
- Verify profile updates persist via Supabase client
- Verify password change requires correct current password
- Verify nav item appears in sidebar
