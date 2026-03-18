# Design: Admin Edit User Profile

**Date:** 2026-03-18
**Issue:** #38
**Status:** Approved

---

## Problem

An admin cannot change profile fields (`icao_code`, `employee_number`, `mandatory_retirement_age`) for another user. This creates a hard blocker: uploading a seniority list on behalf of a user requires the target profile to have an `icao_code`, but there is no UI or API to set it.

---

## Scope

- Admin can edit a user's `icao_code`, `employee_number`, and `mandatory_retirement_age` from the user detail page
- All fields are optional in the request — partial updates are supported
- Role editing is explicitly out of scope (handled separately via the users table)
- Non-admin access to this endpoint returns 403

---

## Architecture

### New endpoint: `PATCH /api/admin/users/[id]/profile`

File: `server/api/admin/users/[id]/profile.patch.ts`

- Verifies the caller is an admin via `requireAdmin(event)`
- Validates the request body against `UpdateUserProfileSchema` (all fields optional)
- Uses `serverSupabaseServiceRole()` to perform the update (cross-user write, bypasses RLS safely inside a server route)
- Builds the update object from only the fields present in the parsed body (partial update)
- Returns the updated profile fields on success
- Returns 400 on validation failure, 403 on non-admin, 404 if user not found, 500 on DB error

The existing `PATCH /api/admin/users/[id]` (role-only) is untouched.

### New schema: `UpdateUserProfileSchema`

File: `shared/schemas/admin.ts` (add alongside existing schemas)

```ts
export const UpdateUserProfileSchema = z.object({
  icaoCode: z.string().min(2).max(4).nullable().optional(),
  employeeNumber: z.string().max(20).nullable().optional(),
  mandatoryRetirementAge: z.number().int().min(55).max(70).optional(),
})
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>
```

At least one field must be present (`.refine` check) to avoid no-op PATCH requests.

### UI: Edit Profile modal on admin user detail page

File: `app/pages/admin/users/[id].vue`

- An "Edit Profile" `UButton` is added to the Profile Card header
- Clicking opens a `UModal` containing:
  - **Airline** — `USelectMenu` populated via `useAirlineOptions()` (same composable as `setup-profile.vue`)
  - **Employee Number** — `UInput`
  - **Mandatory Retirement Age** — `UInputNumber` (integer, min 55, max 70)
- Modal pre-fills from the current `user` ref values
- On save: calls `PATCH /api/admin/users/[id]/profile` with only changed fields, closes modal, shows success toast, patches the local `user` ref so the profile card updates without reload
- On error: shows error toast, keeps modal open

---

## Data Flow

```
Admin clicks "Edit Profile"
  → Modal opens, pre-filled from user ref
  → Admin edits fields, clicks Save
  → PATCH /api/admin/users/[id]/profile { icaoCode?, employeeNumber?, mandatoryRetirementAge? }
  → Server: requireAdmin → validateBody → build partial update object → serviceRole.update(profiles)
  → 200 + updated fields
  → Close modal, toast "Profile updated", patch local user ref
```

---

## Error Handling

| Scenario | Response |
|---|---|
| Non-admin caller | 403 Forbidden |
| Body fails Zod validation | 400 with field errors |
| No fields provided | 400 "At least one field required" |
| User not found in profiles | 404 |
| DB error | 500 |
| Success | 200 + updated profile fields |

---

## Testing

### API (unit/integration)

- Given a valid admin session + valid body → returns 200 with updated fields
- Given a non-admin session → returns 403
- Given an empty body → returns 400
- Given an invalid `icaoCode` format → returns 400
- Partial body (only `icaoCode`) → only `icao_code` updated in DB, other fields unchanged

### UI (component)

- "Edit Profile" button renders in the Profile Card
- Modal opens with fields pre-filled from current user values
- Submitting a valid form calls `PATCH /api/admin/users/[id]/profile`
- On success: modal closes, toast shown, profile card reflects new values
- On error: modal stays open, error toast shown

---

## Files Changed

| File | Change |
|---|---|
| `shared/schemas/admin.ts` | Add `UpdateUserProfileSchema` |
| `server/api/admin/users/[id]/profile.patch.ts` | New endpoint |
| `app/pages/admin/users/[id].vue` | Add "Edit Profile" button + modal |
| `shared/schemas/admin.test.ts` | Schema unit tests |
| `server/api/admin/users/[id]/profile.patch.test.ts` | Endpoint tests |
| `app/pages/admin/users/__tests__/[id].test.ts` | Component tests |
