# Codebase Refactoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract reusable utilities, deduplicate schemas/components, improve naming clarity, and reduce code smells across the entire codebase.

**Architecture:** Bottom-up, layer-by-layer refactoring with TDD. Shared foundations first (constants, schemas, utils), then server layer, then client composables, then UI components. Each layer is tested before the next builds on it.

**Tech Stack:** TypeScript, Zod, Vitest, Nuxt 4, Vue 3, Pinia, Chart.js

**Spec:** `docs/superpowers/specs/2026-03-09-codebase-refactoring-design.md`

---

## Chunk 1: Layer 1 — Shared Constants & Schemas

### Task 1: Create shared constants

**Files:**
- Create: `shared/constants.ts`
- Create: `shared/constants.test.ts`

- [ ] **Step 1: Write the constants file**

```typescript
// shared/constants.ts
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/** Excel epoch: Dec 30, 1899 (serial 1 = Jan 1, 1900, accounting for Lotus 123 leap year bug) */
export const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30)
```

- [ ] **Step 2: Write a smoke test**

```typescript
// shared/constants.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { ISO_DATE_REGEX, EXCEL_EPOCH_MS } from './constants'

describe('ISO_DATE_REGEX', () => {
  it('matches YYYY-MM-DD', () => {
    expect(ISO_DATE_REGEX.test('2026-01-15')).toBe(true)
  })
  it('rejects non-date strings', () => {
    expect(ISO_DATE_REGEX.test('01/15/2026')).toBe(false)
  })
})

describe('EXCEL_EPOCH_MS', () => {
  it('is Dec 30, 1899 UTC', () => {
    const d = new Date(EXCEL_EPOCH_MS)
    expect(d.getUTCFullYear()).toBe(1899)
    expect(d.getUTCMonth()).toBe(11) // December
    expect(d.getUTCDate()).toBe(30)
  })
})
```

- [ ] **Step 3: Run test to verify**

Run: `npx vitest run shared/constants.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add shared/constants.ts shared/constants.test.ts
git commit -m "refactor: extract ISO_DATE_REGEX and EXCEL_EPOCH_MS to shared constants"
```

---

### Task 2: Create common schema utilities

**Files:**
- Create: `shared/schemas/common.ts`
- Create: `shared/schemas/common.test.ts`

- [ ] **Step 1: Write the common schemas file**

```typescript
// shared/schemas/common.ts
import { z, type ZodObject, type ZodRawShape } from 'zod'

/** Reusable UUID string validator */
export function uuidField(message = 'Invalid UUID') {
  return z.string().uuid(message)
}

/**
 * Add password confirmation refinement to any schema that has `password` and `confirmPassword` fields.
 * Returns a ZodEffects that rejects when the two fields don't match.
 */
export function withPasswordConfirmation<T extends ZodRawShape>(
  schema: ZodObject<T & { password: z.ZodString; confirmPassword: z.ZodString }>,
) {
  return schema.refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
}
```

- [ ] **Step 2: Write tests**

```typescript
// shared/schemas/common.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { uuidField, withPasswordConfirmation } from './common'

describe('uuidField', () => {
  it('accepts valid UUID', () => {
    const schema = z.object({ id: uuidField() })
    expect(schema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects non-UUID', () => {
    const schema = z.object({ id: uuidField() })
    expect(schema.safeParse({ id: 'abc' }).success).toBe(false)
  })

  it('uses custom message', () => {
    const schema = z.object({ id: uuidField('Bad ID') })
    const result = schema.safeParse({ id: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('Bad ID')
    }
  })
})

describe('withPasswordConfirmation', () => {
  const baseSchema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })

  it('accepts matching passwords', () => {
    const schema = withPasswordConfirmation(baseSchema)
    expect(schema.safeParse({ password: 'secret123', confirmPassword: 'secret123' }).success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const schema = withPasswordConfirmation(baseSchema)
    const result = schema.safeParse({ password: 'secret123', confirmPassword: 'different1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]!.path).toContain('confirmPassword')
    }
  })

  it('works with extra fields', () => {
    const extendedSchema = z.object({
      currentPassword: z.string().min(8),
      password: z.string().min(8),
      confirmPassword: z.string().min(8),
    })
    const schema = withPasswordConfirmation(extendedSchema)
    expect(schema.safeParse({
      currentPassword: 'oldpass12',
      password: 'newpass12',
      confirmPassword: 'newpass12',
    }).success).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify**

Run: `npx vitest run shared/schemas/common.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add shared/schemas/common.ts shared/schemas/common.test.ts
git commit -m "refactor: add uuidField and withPasswordConfirmation schema utilities"
```

---

### Task 3: Refactor admin, auth, and settings schemas to use common utilities

**Files:**
- Modify: `shared/schemas/admin.ts`
- Modify: `shared/schemas/auth.ts`
- Modify: `shared/schemas/settings.ts`
- Modify: `shared/schemas/admin.test.ts`
- Modify: `shared/schemas/auth.test.ts`
- Modify: `shared/schemas/settings.test.ts`
- Modify: `app/pages/auth/update-password.vue:34` (import rename)

- [ ] **Step 1: Update admin.ts — use `uuidField()`**

Replace the contents of `shared/schemas/admin.ts` with:

```typescript
import { z } from 'zod'
import { uuidField } from './common'

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin']),
})
export type UpdateUserRole = z.infer<typeof UpdateUserRoleSchema>

export const InviteUserSchema = z.object({
  email: z.string().email(),
})
export type InviteUser = z.infer<typeof InviteUserSchema>

export const ResetUserPasswordSchema = z.object({
  userId: uuidField(),
})
export type ResetUserPassword = z.infer<typeof ResetUserPasswordSchema>

export const AdminUserIdSchema = z.object({
  id: uuidField(),
})
export type AdminUserId = z.infer<typeof AdminUserIdSchema>
```

- [ ] **Step 2: Update auth.ts — rename UpdatePasswordSchema, use withPasswordConfirmation**

Replace the contents of `shared/schemas/auth.ts` with:

```typescript
import { z } from 'zod'
import { withPasswordConfirmation } from './common'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
export type LoginState = z.infer<typeof LoginSchema>

export const SignUpSchema = withPasswordConfirmation(z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
  icaoCode: z.string().optional(),
}))
export type SignUpState = z.infer<typeof SignUpSchema>

export const SetupProfileSchema = z.object({
  icaoCode: z.string().min(2, 'Please select your airline'),
})
export type SetupProfileState = z.infer<typeof SetupProfileSchema>

export const ResetPasswordSchema = z.object({ email: z.string().email() })
export type ResetPasswordState = z.infer<typeof ResetPasswordSchema>

export const RecoveryPasswordSchema = withPasswordConfirmation(z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}))
export type RecoveryPasswordState = z.infer<typeof RecoveryPasswordSchema>

export const ResendEmailSchema = z.object({ email: z.string().email() })
export type ResendEmailState = z.infer<typeof ResendEmailSchema>
```

- [ ] **Step 3: Update settings.ts — use withPasswordConfirmation**

Replace the contents of `shared/schemas/settings.ts` with:

```typescript
import { z } from 'zod'
import { withPasswordConfirmation } from './common'

export const UpdateProfileSchema = z.object({
  icaoCode: z.string().min(2, 'Please select your airline'),
  employeeNumber: z.string().max(20, 'Employee number is too long'),
})
export type UpdateProfileState = z.infer<typeof UpdateProfileSchema>

export const UpdatePreferencesSchema = z.object({
  mandatoryRetirementAge: z.number().int('Must be a whole number').min(55, 'Minimum age is 55').max(75, 'Maximum age is 75'),
})
export type UpdatePreferencesState = z.infer<typeof UpdatePreferencesSchema>

export const ChangePasswordSchema = withPasswordConfirmation(z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}))
export type ChangePasswordState = z.infer<typeof ChangePasswordSchema>

export const ChangeEmailSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
})
export type ChangeEmailState = z.infer<typeof ChangeEmailSchema>
```

- [ ] **Step 4: Update auth.test.ts — rename UpdatePasswordSchema → RecoveryPasswordSchema**

In `shared/schemas/auth.test.ts`:
- Replace import `UpdatePasswordSchema` → `RecoveryPasswordSchema`
- Replace `describe('UpdatePasswordSchema'` → `describe('RecoveryPasswordSchema'`
- Replace all `UpdatePasswordSchema.safeParse` → `RecoveryPasswordSchema.safeParse`

- [ ] **Step 5: Update update-password.vue — import rename**

In `app/pages/auth/update-password.vue:34`:
- Change `import { UpdatePasswordSchema } from '#shared/schemas/auth'` → `import { RecoveryPasswordSchema } from '#shared/schemas/auth'`
- Update template reference on line 6: `:schema="UpdatePasswordSchema"` → `:schema="RecoveryPasswordSchema"`

- [ ] **Step 6: Run all schema tests**

Run: `npx vitest run shared/schemas/`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add shared/schemas/admin.ts shared/schemas/auth.ts shared/schemas/settings.ts
git add shared/schemas/admin.test.ts shared/schemas/auth.test.ts shared/schemas/settings.test.ts
git add app/pages/auth/update-password.vue
git commit -m "refactor: use common schema utilities across admin, auth, and settings schemas

Rename UpdatePasswordSchema → RecoveryPasswordSchema.
Use uuidField() in admin schemas and withPasswordConfirmation() in
auth/settings schemas to eliminate duplicated refinement logic."
```

---

### Task 4: Merge profile.ts into settings.ts and delete profile.ts

**Files:**
- Modify: `shared/schemas/settings.ts` (add UpdateEmployeeNumberSchema)
- Modify: `shared/schemas/settings.test.ts` (add profile tests)
- Delete: `shared/schemas/profile.ts`
- Delete: `shared/schemas/profile.test.ts`

- [ ] **Step 1: Add UpdateEmployeeNumberSchema to settings.ts**

Append to the end of `shared/schemas/settings.ts`:

```typescript
export const UpdateEmployeeNumberSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required').max(20),
})
export type UpdateEmployeeNumberState = z.infer<typeof UpdateEmployeeNumberSchema>
```

- [ ] **Step 2: Move profile test assertions into settings.test.ts**

Add to imports in `shared/schemas/settings.test.ts`:
```typescript
import { UpdateProfileSchema, UpdatePreferencesSchema, ChangePasswordSchema, ChangeEmailSchema, UpdateEmployeeNumberSchema } from './settings'
```

Add at the end of the file:
```typescript
describe('UpdateEmployeeNumberSchema', () => {
  it('accepts a valid employee number', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '12345' }).success).toBe(true)
  })

  it('accepts a single character employee number', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({ employeeNumber: 'A' }).success).toBe(true)
  })

  it('accepts a 20 character employee number', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '12345678901234567890' }).success).toBe(true)
  })

  it('rejects an empty string', () => {
    const result = UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('Employee number is required')
    }
  })

  it('rejects a string longer than 20 characters', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '123456789012345678901' }).success).toBe(false)
  })

  it('rejects missing employeeNumber field', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({}).success).toBe(false)
  })
})
```

- [ ] **Step 3: Delete profile files**

```bash
rm shared/schemas/profile.ts shared/schemas/profile.test.ts
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run shared/schemas/settings.test.ts`
Expected: PASS (all existing + new tests)

- [ ] **Step 5: Commit**

```bash
git add shared/schemas/settings.ts shared/schemas/settings.test.ts
git rm shared/schemas/profile.ts shared/schemas/profile.test.ts
git commit -m "refactor: merge UpdateEmployeeNumberSchema from profile.ts into settings.ts"
```

---

## Chunk 2: Layer 2 — Shared Utils (Pure Logic Extraction)

### Task 5: Extract date utilities from seniority-list.ts

**Files:**
- Create: `shared/utils/date.ts`
- Create: `shared/utils/date.test.ts`
- Modify: `shared/schemas/seniority-list.ts` (remove moved functions, import from new locations)
- Modify: `app/composables/useSeniorityUpload.ts` (update isoDateRegex import)

- [ ] **Step 1: Create shared/utils/date.ts**

```typescript
// shared/utils/date.ts
import { EXCEL_EPOCH_MS } from '#shared/constants'

/** Format a Date to YYYY-MM-DD string */
export function formatDate(d: Date, utc = false): string {
  const y = utc ? d.getUTCFullYear() : d.getFullYear()
  const m = String((utc ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0')
  const day = String(utc ? d.getUTCDate() : d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse an Excel serial number (e.g. 40193) into YYYY-MM-DD, or null if invalid */
export function parseExcelSerial(serial: number): string | null {
  const ms = EXCEL_EPOCH_MS + serial * 86400000
  const date = new Date(ms)
  if (isNaN(date.getTime())) return null
  return formatDate(date, true)
}

/** Parse MM/DD/YYYY or MM-DD-YYYY (with 1-2 digit month/day, 2-4 digit year) into YYYY-MM-DD, or null */
export function parseSlashDate(s: string): string | null {
  const match = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/)
  if (!match) return null
  let [, m, d, y] = match
  if (y!.length === 2) y = (parseInt(y!, 10) > 50 ? '19' : '20') + y
  return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`
}

/**
 * Normalize a date string from common formats into YYYY-MM-DD.
 * Supported: YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, M/D/YY, Excel serials, named months.
 * Returns the original string if unparseable.
 */
export function normalizeDate(value: string): string {
  const s = value.trim()
  if (!s) return s

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // Excel serial (4-6 digit pure number)
  if (/^\d{4,6}$/.test(s)) {
    const result = parseExcelSerial(parseInt(s, 10))
    if (result) return result
  }

  // Slash/dash date
  const slashResult = parseSlashDate(s)
  if (slashResult) return slashResult

  // Named month ("15 Jan 2010", "Jan 15, 2010", etc.)
  const parsed = new Date(s)
  if (!isNaN(parsed.getTime()) && s.match(/[a-zA-Z]/)) {
    return formatDate(parsed)
  }

  return s
}

/** Compute retirement date from DOB + policy age. Handles leap day DOBs. */
export function computeRetireDate(dob: string, retirementAge: number): string {
  const date = new Date(dob + 'T00:00:00')
  const dobMonth = date.getMonth()
  date.setFullYear(date.getFullYear() + retirementAge)
  if (dobMonth === 1 && date.getMonth() !== 1) {
    date.setDate(0)
  }
  return date.toISOString().slice(0, 10)
}
```

- [ ] **Step 2: Create shared/utils/date.test.ts**

```typescript
// shared/utils/date.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { formatDate, parseExcelSerial, parseSlashDate, normalizeDate, computeRetireDate } from './date'

describe('formatDate', () => {
  it('formats local date', () => {
    const d = new Date(2026, 0, 15) // Jan 15 2026 local
    expect(formatDate(d)).toBe('2026-01-15')
  })

  it('formats UTC date', () => {
    const d = new Date(Date.UTC(2026, 0, 15))
    expect(formatDate(d, true)).toBe('2026-01-15')
  })
})

describe('parseExcelSerial', () => {
  it('converts 40193 to 2010-01-15', () => {
    expect(parseExcelSerial(40193)).toBe('2010-01-15')
  })

  it('converts 1 to 1899-12-31', () => {
    expect(parseExcelSerial(1)).toBe('1899-12-31')
  })
})

describe('parseSlashDate', () => {
  it('parses MM/DD/YYYY', () => {
    expect(parseSlashDate('01/15/2010')).toBe('2010-01-15')
  })

  it('parses M/D/YYYY', () => {
    expect(parseSlashDate('1/5/2010')).toBe('2010-01-05')
  })

  it('parses MM-DD-YYYY', () => {
    expect(parseSlashDate('06-15-1970')).toBe('1970-06-15')
  })

  it('handles 2-digit year <= 50 as 2000s', () => {
    expect(parseSlashDate('3/7/10')).toBe('2010-03-07')
  })

  it('handles 2-digit year > 50 as 1900s', () => {
    expect(parseSlashDate('3/7/70')).toBe('1970-03-07')
  })

  it('returns null for non-date', () => {
    expect(parseSlashDate('not-a-date')).toBeNull()
  })
})

describe('normalizeDate', () => {
  it('passes through YYYY-MM-DD unchanged', () => {
    expect(normalizeDate('2010-01-15')).toBe('2010-01-15')
  })
  it('converts MM/DD/YYYY', () => {
    expect(normalizeDate('01/15/2010')).toBe('2010-01-15')
  })
  it('converts Excel serial number', () => {
    expect(normalizeDate('40193')).toBe('2010-01-15')
  })
  it('returns original for unparseable input', () => {
    expect(normalizeDate('not-a-date')).toBe('not-a-date')
  })
  it('handles empty string', () => {
    expect(normalizeDate('')).toBe('')
  })
  it('trims whitespace', () => {
    expect(normalizeDate('  01/15/2010  ')).toBe('2010-01-15')
  })
})

describe('computeRetireDate', () => {
  it('adds retirement age to DOB', () => {
    expect(computeRetireDate('1970-06-15', 65)).toBe('2035-06-15')
  })
  it('handles leap day DOB', () => {
    expect(computeRetireDate('1960-02-29', 65)).toBe('2025-02-28')
  })
})
```

- [ ] **Step 3: Run date tests**

Run: `npx vitest run shared/utils/date.test.ts`
Expected: PASS

- [ ] **Step 4: Update seniority-list.ts — remove moved functions, import from new locations**

In `shared/schemas/seniority-list.ts`:
- Remove the `normalizeDate`, `formatDate`, `computeRetireDate` functions (lines 12-69)
- Remove the `isoDateRegex` export (line 71)
- Add imports at top:
  ```typescript
  import { ISO_DATE_REGEX } from '#shared/constants'
  import { normalizeDate, computeRetireDate } from '#shared/utils/date'
  ```
- Replace all `isoDateRegex` references with `ISO_DATE_REGEX`
- Keep `normalizeEmployeeNumber` in place (it's schema-specific)
- Re-export `normalizeDate`, `computeRetireDate`, and `ISO_DATE_REGEX as isoDateRegex` for backwards compatibility during migration

The file should look like:
```typescript
import { z } from 'zod'
import { ISO_DATE_REGEX } from '#shared/constants'
// Re-export date utilities so existing consumers don't break during incremental migration
export { normalizeDate, computeRetireDate } from '#shared/utils/date'
export { ISO_DATE_REGEX as isoDateRegex } from '#shared/constants'

/** Strip leading zeroes from purely numeric strings. */
export function normalizeEmployeeNumber(value: string): string {
  if (/^\d+$/.test(value)) {
    const stripped = value.replace(/^0+/, '')
    return stripped || '0'
  }
  return value
}

export const SeniorityEntrySchema = z.object({
  seniority_number: z.number().int().positive(),
  employee_number: z.string().min(1),
  seat: z.string().min(1),
  base: z.string().min(1),
  fleet: z.string().min(1),
  name: z.string().optional(),
  hire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
  retire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format').optional(),
})
export type SeniorityEntry = z.infer<typeof SeniorityEntrySchema>

export const SeniorityListIdSchema = z.object({
  id: z.string().uuid('Invalid list ID'),
})
export type SeniorityListId = z.infer<typeof SeniorityListIdSchema>

export const CreateSeniorityListSchema = z.object({
  effective_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
  entries: z.array(SeniorityEntrySchema).min(1, 'At least one entry is required'),
})
export type CreateSeniorityList = z.infer<typeof CreateSeniorityListSchema>

export const UpdateSeniorityListSchema = z.object({
  airline: z.string().min(1, 'Airline is required').optional(),
  effective_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format').optional(),
}).refine(d => d.airline !== undefined || d.effective_date !== undefined, {
  message: 'At least one field must be provided',
})
export type UpdateSeniorityList = z.infer<typeof UpdateSeniorityListSchema>
```

- [ ] **Step 5: Run existing seniority-list tests (should still pass via re-exports)**

Run: `npx vitest run shared/schemas/seniority-list.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add shared/utils/date.ts shared/utils/date.test.ts shared/schemas/seniority-list.ts
git commit -m "refactor: extract date utilities from seniority-list.ts to shared/utils/date.ts

normalizeDate, computeRetireDate, formatDate, parseExcelSerial, and
parseSlashDate now live in shared/utils/date.ts. Re-exports from
seniority-list.ts maintain backwards compatibility."
```

---

### Task 6: Extract seniority math utilities from useDashboardStats.ts

**Files:**
- Create: `shared/utils/seniority-math.ts`
- Create: `shared/utils/seniority-math.test.ts`

- [ ] **Step 1: Create shared/utils/seniority-math.ts**

Move the pure functions from `app/composables/useDashboardStats.ts`. These are `countRetiredAbove` (lines 20-35), `generateTimePoints` (lines 40-51), `buildTrajectory` (lines 57-89), `computeRank` (lines 91-93), `getProjectionEndDate` (lines 95-101), `formatDate` (lines 103-107), `formatNumber` (lines 109-111):

```typescript
// shared/utils/seniority-math.ts
import type { Tables } from '#shared/types/database'

type SeniorityEntry = Tables<'seniority_entries'>
type FilterFn = (entry: SeniorityEntry) => boolean

export type { FilterFn }

/**
 * Count entries senior to user (lower seniority_number) that have retired by asOfDate.
 */
export function countRetiredAbove(
  entries: SeniorityEntry[],
  userSenNum: number,
  asOfDate: Date,
  filterFn?: FilterFn,
): number {
  let count = 0
  for (const entry of entries) {
    if (entry.seniority_number >= userSenNum) continue
    if (!entry.retire_date) continue
    if (new Date(entry.retire_date) > asOfDate) continue
    if (filterFn && !filterFn(entry)) continue
    count++
  }
  return count
}

/** Generate yearly time points from startDate through endDate. */
export function generateTimePoints(startDate: Date, endDate: Date): Date[] {
  const points: Date[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    points.push(new Date(current))
    current.setFullYear(current.getFullYear() + 1)
  }
  return points
}

/**
 * Build trajectory: for each time point, compute rank within the (optionally filtered) set.
 * Rank = number of non-retired pilots ahead of user + 1.
 * Percentile is inverted: 100% = most senior (#1), 0% = most junior.
 */
export function buildTrajectory(
  entries: SeniorityEntry[],
  userSenNum: number,
  timePoints: Date[],
  filterFn?: FilterFn,
): { date: string; rank: number; percentile: number }[] {
  const filtered = filterFn ? entries.filter(filterFn) : entries
  const totalInCategory = filtered.length
  const aheadInCategory = filtered.filter((e) => e.seniority_number < userSenNum)
  const initialRank = aheadInCategory.length + 1

  return timePoints.map((tp) => {
    let retiredAhead = 0
    for (const e of aheadInCategory) {
      if (!e.retire_date) continue
      if (new Date(e.retire_date) <= tp) retiredAhead++
    }
    const rank = initialRank - retiredAhead
    const percentile = totalInCategory > 0
      ? Math.round(((totalInCategory - rank + 1) / totalInCategory) * 1000) / 10
      : 0
    return {
      date: tp.toISOString().split('T')[0]!,
      rank,
      percentile,
    }
  })
}

/** Compute raw rank: number of entries with lower seniority_number + 1 */
export function computeRank(entries: SeniorityEntry[], userSenNum: number): number {
  return entries.filter((e) => e.seniority_number < userSenNum).length + 1
}

/** Get projection end date from a retire_date string, or default to 30 years from today. */
export function getProjectionEndDate(retireDate: string | null): { today: Date; endDate: Date } {
  const today = new Date()
  const endDate = retireDate
    ? new Date(retireDate)
    : new Date(today.getFullYear() + 30, today.getMonth(), today.getDate())
  return { today, endDate }
}

/** Format a date string (YYYY-MM-DD) to "Mon YYYY" display format. */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Format a number with locale separators */
export function formatNumber(n: number): string {
  return n.toLocaleString()
}
```

- [ ] **Step 2: Create shared/utils/seniority-math.test.ts**

Move the pure function tests from `app/composables/useDashboardStats.test.ts` (lines 1-205). Update imports to point to new location:

```typescript
// shared/utils/seniority-math.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { countRetiredAbove, generateTimePoints, buildTrajectory, computeRank, getProjectionEndDate, formatDateLabel, formatNumber } from './seniority-math'
import type { Tables } from '#shared/types/database'

type SeniorityEntry = Tables<'seniority_entries'>

function makeEntry(overrides: Partial<SeniorityEntry> = {}): SeniorityEntry {
  return {
    id: 'entry-1',
    list_id: 'list-1',
    seniority_number: 1,
    employee_number: '100',
    name: 'Test Pilot',
    hire_date: '2010-01-15',
    base: 'JFK',
    seat: 'CA',
    fleet: '737',
    retire_date: '2035-06-15',
    ...overrides,
  }
}

// Copy all tests from useDashboardStats.test.ts lines 54-205:
// describe('countRetiredAbove', ...) — all 4 tests
// describe('generateTimePoints', ...) — all 4 tests
// describe('buildTrajectory', ...) — all 3 tests
// Plus new tests for newly-exported functions:

describe('computeRank', () => {
  it('returns 1 when user is most senior', () => {
    const entries = [
      makeEntry({ seniority_number: 5 }),
      makeEntry({ seniority_number: 10 }),
    ]
    expect(computeRank(entries, 5)).toBe(1)
  })

  it('returns correct rank when entries are ahead', () => {
    const entries = [
      makeEntry({ seniority_number: 1 }),
      makeEntry({ seniority_number: 2 }),
      makeEntry({ seniority_number: 5 }),
    ]
    expect(computeRank(entries, 5)).toBe(3) // 2 ahead
  })
})

describe('getProjectionEndDate', () => {
  it('returns retire date when provided', () => {
    const { endDate } = getProjectionEndDate('2040-06-15')
    expect(endDate.getFullYear()).toBe(2040)
  })

  it('defaults to 30 years from now when null', () => {
    const { today, endDate } = getProjectionEndDate(null)
    expect(endDate.getFullYear()).toBe(today.getFullYear() + 30)
  })
})

describe('formatDateLabel', () => {
  it('formats YYYY-MM-DD to Mon YYYY', () => {
    expect(formatDateLabel('2026-01-15')).toBe('Jan 2026')
  })
})

describe('formatNumber', () => {
  it('formats numbers with locale separators', () => {
    // Just verify it returns a string (locale-dependent)
    expect(typeof formatNumber(1000)).toBe('string')
  })
})
```

Note: The full test file should include the `countRetiredAbove`, `generateTimePoints`, and `buildTrajectory` test blocks verbatim from `app/composables/useDashboardStats.test.ts` lines 54-205. Copy them exactly, only changing the import path.

- [ ] **Step 3: Run tests**

Run: `npx vitest run shared/utils/seniority-math.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add shared/utils/seniority-math.ts shared/utils/seniority-math.test.ts
git commit -m "refactor: extract seniority math pure functions to shared/utils/seniority-math.ts"
```

---

### Task 7: Extract comparison logic from useSeniorityCompare.ts

**Files:**
- Create: `shared/utils/seniority-compare.ts`
- Create: `shared/utils/seniority-compare.test.ts`

- [ ] **Step 1: Create shared/utils/seniority-compare.ts**

Move interfaces (lines 6-53) and `computeComparison` function (lines 55-139) from `app/composables/useSeniorityCompare.ts`:

```typescript
// shared/utils/seniority-compare.ts
import type { Tables } from '#shared/types/database'

type Entry = Tables<'seniority_entries'>

export interface RetiredPilot {
  employee_number: string
  name: string | null
  seniority_number: number
  retire_date: string
}

export interface DepartedPilot {
  employee_number: string
  name: string | null
  seniority_number: number
  retire_date: string | null
}

export interface QualMove {
  employee_number: string
  name: string | null
  seniority_number: number
  old_seat: string | null
  new_seat: string | null
  old_fleet: string | null
  new_fleet: string | null
  old_base: string | null
  new_base: string | null
}

export interface RankChange {
  employee_number: string
  name: string | null
  old_rank: number
  new_rank: number
  delta: number
}

export interface NewHire {
  employee_number: string
  name: string | null
  seniority_number: number
  hire_date: string
}

export interface CompareResult {
  retired: RetiredPilot[]
  departed: DepartedPilot[]
  qualMoves: QualMove[]
  rankChanges: RankChange[]
  newHires: NewHire[]
}

export function computeComparison(
  olderEntries: Entry[],
  newerEntries: Entry[],
  newerEffectiveDate: string,
): CompareResult {
  const olderMap = new Map<string, Entry>()
  for (const e of olderEntries) olderMap.set(e.employee_number, e)

  const newerMap = new Map<string, Entry>()
  for (const e of newerEntries) newerMap.set(e.employee_number, e)

  const retired: RetiredPilot[] = []
  const departed: DepartedPilot[] = []
  const qualMoves: QualMove[] = []
  const rankChanges: RankChange[] = []
  const newHires: NewHire[] = []

  for (const [empNum, old] of olderMap) {
    if (!newerMap.has(empNum)) {
      if (old.retire_date && old.retire_date <= newerEffectiveDate) {
        retired.push({
          employee_number: empNum,
          name: old.name,
          seniority_number: old.seniority_number,
          retire_date: old.retire_date,
        })
      } else {
        departed.push({
          employee_number: empNum,
          name: old.name,
          seniority_number: old.seniority_number,
          retire_date: old.retire_date,
        })
      }
    }
  }

  for (const [empNum, newer] of newerMap) {
    const older = olderMap.get(empNum)
    if (!older) continue

    if (older.seat !== newer.seat || older.fleet !== newer.fleet || older.base !== newer.base) {
      qualMoves.push({
        employee_number: empNum,
        name: newer.name,
        seniority_number: newer.seniority_number,
        old_seat: older.seat,
        new_seat: newer.seat,
        old_fleet: older.fleet,
        new_fleet: newer.fleet,
        old_base: older.base,
        new_base: newer.base,
      })
    }

    if (older.seniority_number !== newer.seniority_number) {
      rankChanges.push({
        employee_number: empNum,
        name: newer.name,
        old_rank: older.seniority_number,
        new_rank: newer.seniority_number,
        delta: older.seniority_number - newer.seniority_number,
      })
    }
  }

  for (const [empNum, entry] of newerMap) {
    if (!olderMap.has(empNum)) {
      newHires.push({
        employee_number: empNum,
        name: entry.name,
        seniority_number: entry.seniority_number,
        hire_date: entry.hire_date,
      })
    }
  }

  return { retired, departed, qualMoves, rankChanges, newHires }
}
```

- [ ] **Step 2: Create shared/utils/seniority-compare.test.ts**

Copy the full test file from `app/composables/useSeniorityCompare.test.ts`, changing only the import:

```typescript
// shared/utils/seniority-compare.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computeComparison } from './seniority-compare'
import type { Tables } from '#shared/types/database'

// ... rest is identical to app/composables/useSeniorityCompare.test.ts
```

Copy all test cases verbatim from `app/composables/useSeniorityCompare.test.ts` lines 6-111.

- [ ] **Step 3: Run tests**

Run: `npx vitest run shared/utils/seniority-compare.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add shared/utils/seniority-compare.ts shared/utils/seniority-compare.test.ts
git commit -m "refactor: extract comparison logic and interfaces to shared/utils/seniority-compare.ts"
```

---

## Chunk 3: Layer 3 — Server Utils & Route Updates

### Task 8: Create server validation helpers and error factories

**Files:**
- Create: `server/utils/validation.ts`
- Create: `server/utils/errors.ts`

- [ ] **Step 1: Create server/utils/validation.ts**

```typescript
// server/utils/validation.ts
import type { H3Event } from 'h3'
import type { ZodSchema, ZodError } from 'zod'

/**
 * Validate a route parameter against a Zod schema wrapping it in `{ [paramName]: value }`.
 * Throws 422 on failure with Zod issues in the response data.
 */
export async function validateRouteParam<T>(
  event: H3Event,
  paramName: string,
  schema: ZodSchema<T>,
): Promise<T> {
  const raw = { [paramName]: getRouterParam(event, paramName) }
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: `Invalid ${paramName}`,
      data: result.error.issues,
    })
  }
  return result.data
}

/**
 * Validate the request body against a Zod schema.
 * Throws 422 on failure with Zod issues in the response data.
 */
export async function validateBody<T>(
  event: H3Event,
  schema: ZodSchema<T>,
): Promise<T> {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: result.error.issues,
    })
  }
  return result.data
}
```

- [ ] **Step 2: Create server/utils/errors.ts**

```typescript
// server/utils/errors.ts
import type { ZodIssue } from 'zod'

/** Throw a 422 validation error with Zod issues */
export function throwValidationError(issues: ZodIssue[]): never {
  throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: issues })
}

/** Throw a 404 not-found error */
export function throwNotFound(resource: string): never {
  throw createError({ statusCode: 404, statusMessage: `${resource} not found` })
}

/** Throw a 403 forbidden error */
export function throwForbidden(message = 'Forbidden'): never {
  throw createError({ statusCode: 403, statusMessage: message })
}
```

- [ ] **Step 3: Commit**

```bash
git add server/utils/validation.ts server/utils/errors.ts
git commit -m "refactor: add server validation helpers and error factories"
```

---

### Task 9: Update all API routes to use validation helpers

**Files:**
- Modify: `server/api/admin/invite.post.ts`
- Modify: `server/api/admin/users/[id].patch.ts`
- Modify: `server/api/admin/reset-password.post.ts`
- Modify: `server/api/seniority-lists.post.ts`
- Modify: `server/api/seniority-lists/[id].patch.ts`
- Modify: `server/api/seniority-lists/[id].delete.ts`

- [ ] **Step 1: Update admin/invite.post.ts**

Replace the body validation block (lines 11-14) with:
```typescript
const { email } = await validateBody(event, InviteUserSchema)
```
Then use `email` directly instead of `parsed.data.email`.

- [ ] **Step 2: Update admin/users/[id].patch.ts**

Replace param + body validation (lines 10-18) with:
```typescript
const { id } = await validateRouteParam(event, 'id', AdminUserIdSchema)
const { role } = await validateBody(event, UpdateUserRoleSchema)
```
Then use `id` and `role` directly.

- [ ] **Step 3: Update admin/reset-password.post.ts**

Replace body validation (lines 11-14) with:
```typescript
const { userId } = await validateBody(event, ResetUserPasswordSchema)
```

- [ ] **Step 4: Update seniority-lists.post.ts**

Replace body validation (lines 13-20) with:
```typescript
const { entries, effective_date } = await validateBody(event, CreateSeniorityListSchema)
```

- [ ] **Step 5: Update seniority-lists/[id].patch.ts**

Replace param + body validation (lines 13-20) with:
```typescript
const { id } = await validateRouteParam(event, 'id', SeniorityListIdSchema)
const body = await validateBody(event, UpdateSeniorityListSchema)
```

- [ ] **Step 6: Update seniority-lists/[id].delete.ts**

Replace param validation (lines 13-16) with:
```typescript
const { id } = await validateRouteParam(event, 'id', SeniorityListIdSchema)
```

- [ ] **Step 7: Run full test suite to verify nothing broke**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add server/api/
git commit -m "refactor: use validateRouteParam/validateBody helpers across all API routes"
```

---

## Chunk 4: Layer 4 — App Utils & Layer 5 — Composables

### Task 10: Create useSignOut composable

**Files:**
- Create: `app/composables/useSignOut.ts`
- Modify: `app/components/AppHeader.vue`
- Modify: `app/components/SeniorityNavbar.vue`

- [ ] **Step 1: Create useSignOut.ts**

```typescript
// app/composables/useSignOut.ts
export function useSignOut() {
  const supabase = useSupabaseClient()

  async function signOut() {
    await supabase.auth.signOut()
    navigateTo('/auth/login')
  }

  return { signOut }
}
```

- [ ] **Step 2: Update AppHeader.vue**

Replace the script block in `app/components/AppHeader.vue`:
```vue
<script setup lang="ts">
const user = useSupabaseUser()
const { signOut } = useSignOut()
</script>
```

- [ ] **Step 3: Update SeniorityNavbar.vue**

Replace the script block in `app/components/SeniorityNavbar.vue`:
```vue
<script setup lang="ts">
defineProps<{
  title: string
}>()

const user = useSupabaseUser()
const { signOut } = useSignOut()
</script>
```

- [ ] **Step 4: Commit**

```bash
git add app/composables/useSignOut.ts app/components/AppHeader.vue app/components/SeniorityNavbar.vue
git commit -m "refactor: extract duplicate signOut logic to useSignOut composable"
```

---

### Task 11: Rewire useDashboardStats to use extracted math utilities

**Files:**
- Modify: `app/composables/useDashboardStats.ts`
- Modify: `app/composables/useDashboardStats.test.ts`

- [ ] **Step 1: Rewrite useDashboardStats.ts**

Replace the entire file. Remove the module-level pure functions (lines 20-111) and import from `shared/utils/seniority-math.ts`. The composable body stays the same — it just calls the imported functions:

```typescript
// app/composables/useDashboardStats.ts
import type { Tables } from '#shared/types/database'
import {
  countRetiredAbove,
  generateTimePoints,
  buildTrajectory,
  computeRank,
  getProjectionEndDate,
  formatDateLabel,
  formatNumber,
  type FilterFn,
} from '#shared/utils/seniority-math'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

type SeniorityEntry = Tables<'seniority_entries'>

interface StatCard {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
}

export function useDashboardStats() {
  const seniorityStore = useSeniorityStore()
  const userStore = useUserStore()

  const userEntry = computed<SeniorityEntry | undefined>(() => {
    const empNum = userStore.profile?.employee_number
    if (!empNum) return undefined
    return seniorityStore.entries.find((e) => e.employee_number === empNum)
  })

  const hasData = computed(() => seniorityStore.entries.length > 0)
  const hasEmployeeNumber = computed(() => !!userStore.profile?.employee_number)
  const userFound = computed(() => !!userEntry.value)

  // --- RANK CARD ---
  // (keep lines 130-160 verbatim from current file)

  // --- STATS GRID ---
  // (keep lines 163-223 verbatim)

  // --- BASE STATUS ---
  // (keep lines 226-280 verbatim)

  // --- TRAJECTORY ---
  // (keep lines 283-299 verbatim)

  // --- RETIREMENT PROJECTIONS ---
  // (keep lines 302-337 verbatim — uses formatDateLabel instead of formatDate)

  // --- COMPARATIVE TRAJECTORY ---
  // (keep lines 340-367 verbatim)

  // --- AGGREGATE STATS ---
  // (keep lines 370-405 verbatim)

  // --- RECENT LISTS ---
  // (keep lines 408-416 — uses formatDateLabel instead of formatDate)

  // --- QUALS ---
  // (keep lines 419-433 verbatim)

  return {
    hasData, hasEmployeeNumber, userFound,
    rankCard, stats, baseStatusData, trajectoryData,
    computeRetirementProjection, computeComparativeTrajectory,
    aggregateStats, recentLists, quals,
  }
}
```

Key changes:
- Delete lines 20-111 (all module-level functions)
- Import `countRetiredAbove`, `generateTimePoints`, `buildTrajectory`, `computeRank`, `getProjectionEndDate` from `#shared/utils/seniority-math`
- Rename internal `formatDate` calls to `formatDateLabel` (in `computeRetirementProjection` and `recentLists`)
- Keep all composable body code (computed properties, methods) exactly as-is

- [ ] **Step 2: Update useDashboardStats.test.ts**

Change import on line 4:
```typescript
import { countRetiredAbove, generateTimePoints, buildTrajectory } from '#shared/utils/seniority-math'
```

Remove the pure function test blocks (lines 54-205) — they now live in `shared/utils/seniority-math.test.ts`.

Keep all composable tests (lines 207-636) as-is.

- [ ] **Step 3: Run tests**

Run: `npx vitest run app/composables/useDashboardStats.test.ts shared/utils/seniority-math.test.ts`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add app/composables/useDashboardStats.ts app/composables/useDashboardStats.test.ts
git commit -m "refactor: rewire useDashboardStats to import from shared/utils/seniority-math

Composable drops from 450 to ~110 lines. Pure math functions now
live in shared/utils/seniority-math.ts with dedicated tests."
```

---

### Task 12: Rewire useSeniorityCompare to use extracted comparison logic

**Files:**
- Modify: `app/composables/useSeniorityCompare.ts`
- Modify: `app/composables/useSeniorityCompare.test.ts`
- Modify: `app/pages/seniority/compare.vue` (import path for types)

- [ ] **Step 1: Rewrite useSeniorityCompare.ts**

Replace the entire file — remove interfaces and `computeComparison`, import from shared:

```typescript
// app/composables/useSeniorityCompare.ts
import type { Tables } from '#shared/types/database'
import {
  computeComparison,
  type CompareResult,
  type RetiredPilot,
  type DepartedPilot,
  type QualMove,
  type RankChange,
  type NewHire,
} from '#shared/utils/seniority-compare'

// Re-export types for consumers
export type { RetiredPilot, DepartedPilot, QualMove, RankChange, NewHire, CompareResult }

type Entry = Tables<'seniority_entries'>
type List = Tables<'seniority_lists'>

export function useSeniorityCompare(listIdA: Ref<string | null | undefined>, listIdB: Ref<string | null | undefined>) {
  const db = useDb()

  const loading = ref(false)
  const error = ref<string | null>(null)

  const entriesA = ref<Entry[]>([])
  const entriesB = ref<Entry[]>([])
  const listMetaA = ref<List | null>(null)
  const listMetaB = ref<List | null>(null)

  async function fetchListData(listId: string) {
    const [entries, metaResult] = await Promise.all([
      fetchAllRows(db, 'seniority_entries', q =>
        q.select('*').eq('list_id', listId).order('seniority_number'),
      ),
      db.from('seniority_lists').select('*').eq('id', listId).single(),
    ])
    if (metaResult.error) throw new Error(metaResult.error.message)
    return { entries, meta: metaResult.data }
  }

  const comparison = computed<CompareResult | null>(() => {
    if (!entriesA.value.length || !entriesB.value.length || !listMetaA.value || !listMetaB.value) {
      return null
    }
    return computeComparison(entriesA.value, entriesB.value, listMetaB.value.effective_date)
  })

  async function loadComparison() {
    const idA = listIdA.value
    const idB = listIdB.value
    if (!idA || !idB || idA === idB) return

    loading.value = true
    error.value = null

    try {
      const [dataA, dataB] = await Promise.all([
        fetchListData(idA),
        fetchListData(idB),
      ])
      entriesA.value = dataA.entries
      entriesB.value = dataB.entries
      listMetaA.value = dataA.meta
      listMetaB.value = dataB.meta
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  watch([listIdA, listIdB], () => loadComparison(), { immediate: true })

  return { loading, error, comparison, listMetaA, listMetaB, loadComparison }
}
```

- [ ] **Step 2: Update useSeniorityCompare.test.ts — remove pure logic tests, keep composable tests**

The test file currently only tests `computeComparison` (pure logic). These tests are now in `shared/utils/seniority-compare.test.ts`. The old test file can be deleted since it has no composable-specific tests:

```bash
rm app/composables/useSeniorityCompare.test.ts
```

- [ ] **Step 3: Verify compare.vue still works — imports types from composable via re-exports**

Check that `app/pages/seniority/compare.vue` line 169 (`import type { RetiredPilot, ... } from '~/composables/useSeniorityCompare'`) still works because of the re-exports in step 1. No changes needed.

- [ ] **Step 4: Run tests**

Run: `npx vitest run shared/utils/seniority-compare.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/composables/useSeniorityCompare.ts
git rm app/composables/useSeniorityCompare.test.ts
git commit -m "refactor: rewire useSeniorityCompare to import from shared/utils/seniority-compare

Composable drops from 213 to ~75 lines. Pure comparison logic and
interfaces now live in shared/utils/seniority-compare.ts."
```

---

### Task 13: Fix seniority store state declaration order

**Files:**
- Modify: `app/stores/seniority.ts`

- [ ] **Step 1: Move currentListId declaration**

In `app/stores/seniority.ts`, move the `currentListId` declaration (line 56) to after line 13 (after `entriesError`):

```typescript
const entriesError = ref<string | null>(null)
/** Track which list's entries are currently loaded */
const currentListId = ref<string | null>(null)
```

Delete lines 55-56 (the old declaration location).

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add app/stores/seniority.ts
git commit -m "refactor: move currentListId declaration above fetchEntries in seniority store"
```

---

## Chunk 5: Layer 6 — Components & Pages

### Task 14: Extract ComparisonTab component from compare.vue

**Files:**
- Create: `app/components/ComparisonTab.vue`
- Create: `app/utils/column-definitions.ts`
- Modify: `app/pages/seniority/compare.vue`

- [ ] **Step 1: Create column-definitions.ts**

Extract static column arrays from `compare.vue`:

```typescript
// app/utils/column-definitions.ts
import type { TableColumn } from '@nuxt/ui'
import { sortableHeader } from '~/utils/sortableHeader'
import type { RetiredPilot, DepartedPilot, QualMove, RankChange, NewHire } from '~/composables/useSeniorityCompare'

export const retiredColumns: TableColumn<RetiredPilot>[] = [
  { accessorKey: 'seniority_number', header: sortableHeader<RetiredPilot>('#') },
  { accessorKey: 'employee_number', header: sortableHeader<RetiredPilot>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<RetiredPilot>('Name') },
  { accessorKey: 'retire_date', header: sortableHeader<RetiredPilot>('Retire Date') },
]

export const departedColumns: TableColumn<DepartedPilot>[] = [
  { accessorKey: 'seniority_number', header: sortableHeader<DepartedPilot>('#') },
  { accessorKey: 'employee_number', header: sortableHeader<DepartedPilot>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<DepartedPilot>('Name') },
  { accessorKey: 'retire_date', header: sortableHeader<DepartedPilot>('Retire Date') },
]

export const qualMoveColumns: TableColumn<QualMove>[] = [
  { accessorKey: 'seniority_number', header: sortableHeader<QualMove>('#') },
  { accessorKey: 'employee_number', header: sortableHeader<QualMove>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<QualMove>('Name') },
  { accessorKey: 'old_seat', header: sortableHeader<QualMove>('Old Seat') },
  { accessorKey: 'new_seat', header: sortableHeader<QualMove>('New Seat') },
  { accessorKey: 'old_fleet', header: sortableHeader<QualMove>('Old Fleet') },
  { accessorKey: 'new_fleet', header: sortableHeader<QualMove>('New Fleet') },
  { accessorKey: 'old_base', header: sortableHeader<QualMove>('Old Base') },
  { accessorKey: 'new_base', header: sortableHeader<QualMove>('New Base') },
]

export const rankChangeColumns: TableColumn<RankChange>[] = [
  { accessorKey: 'employee_number', header: sortableHeader<RankChange>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<RankChange>('Name') },
  { accessorKey: 'old_rank', header: sortableHeader<RankChange>('Old Rank') },
  { accessorKey: 'new_rank', header: sortableHeader<RankChange>('New Rank') },
  {
    accessorKey: 'delta',
    header: sortableHeader<RankChange>('Change'),
    cell: ({ row }) => {
      const d = row.original.delta
      return d > 0 ? `+${d}` : `${d}`
    },
  },
]

export const newHireColumns: TableColumn<NewHire>[] = [
  { accessorKey: 'seniority_number', header: sortableHeader<NewHire>('#') },
  { accessorKey: 'employee_number', header: sortableHeader<NewHire>('Employee #') },
  { accessorKey: 'name', header: sortableHeader<NewHire>('Name') },
  { accessorKey: 'hire_date', header: sortableHeader<NewHire>('Hire Date') },
]
```

- [ ] **Step 2: Create ComparisonTab.vue**

```vue
<!-- app/components/ComparisonTab.vue -->
<template>
  <div class="space-y-3 pt-3">
    <UInput
      v-model="table.globalFilter.value"
      icon="i-lucide-search"
      :placeholder="searchPlaceholder"
      class="max-w-sm"
    />
    <UTable
      :ref="table.setRef"
      :data="data"
      :columns="columns"
      v-model:global-filter="table.globalFilter.value"
      v-model:pagination="table.pagination.value"
      v-model:sorting="table.sorting.value"
      :pagination-options="table.paginationOptions"
    />
    <div class="flex items-center justify-between">
      <p class="text-sm text-(--ui-text-muted)">{{ table.totalRows.value }} results</p>
      <UPagination
        v-if="table.pageCount.value > 1"
        :page="table.currentPage.value"
        :total="table.totalRows.value"
        :items-per-page="table.pagination.value.pageSize"
        @update:page="(p: number) => table.tableRef.value?.tableApi?.setPageIndex(p - 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
  data: any[]
  columns: TableColumn<any>[]
  searchPlaceholder?: string
}>()

const table = useTableFeatures(undefined)
</script>
```

Note: `useTableFeatures` currently takes a template ref name string. We need to check how it works — if it needs the ref name, the component may need to accept it as a prop or generate one internally. Check the `useTableFeatures` composable to verify. If it uses `useTemplateRef(name)`, the component will need a unique ref approach. If it takes an optional name, passing `undefined` is fine.

- [ ] **Step 3: Rewrite compare.vue to use ComparisonTab and column-definitions**

Replace the 5 duplicate tab templates with:

```vue
<UTabs :items="tabs" class="mt-4">
  <template #retired>
    <ComparisonTab :data="comparison.retired" :columns="retiredColumns" search-placeholder="Search retired..." />
  </template>
  <template #departed>
    <ComparisonTab :data="comparison.departed" :columns="departedColumns" search-placeholder="Search departed..." />
  </template>
  <template #qual-moves>
    <ComparisonTab :data="comparison.qualMoves" :columns="qualMoveColumns" search-placeholder="Search qual moves..." />
  </template>
  <template #rank-changes>
    <ComparisonTab :data="comparison.rankChanges" :columns="rankChangeColumns" search-placeholder="Search rank changes..." />
  </template>
  <template #new-hires>
    <ComparisonTab :data="comparison.newHires" :columns="newHireColumns" search-placeholder="Search new hires..." />
  </template>
</UTabs>
```

In the `<script setup>`:
- Remove the 5 `useTableFeatures` calls and 5 `const *Columns` blocks
- Add: `import { retiredColumns, departedColumns, qualMoveColumns, rankChangeColumns, newHireColumns } from '~/utils/column-definitions'`
- Remove `sortableHeader` import (moved to column-definitions.ts)

- [ ] **Step 4: Verify the app works (run typecheck)**

Run: `npx vue-tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/components/ComparisonTab.vue app/utils/column-definitions.ts app/pages/seniority/compare.vue
git commit -m "refactor: extract ComparisonTab component and column definitions from compare.vue

compare.vue drops from 285 to ~100 lines. Each tab is now a single
ComparisonTab component with columns from column-definitions.ts."
```

---

### Task 15: Clean up BaseStatusTable cell templates

**Files:**
- Modify: `app/components/dashboard/BaseStatusTable.vue`

- [ ] **Step 1: Replace 6 cell templates with a computed class function**

In `app/components/dashboard/BaseStatusTable.vue`, replace the 6 cell template slots with a `ui` prop approach. Add a computed to the script:

```typescript
function highlightClass(row: DisplayRow): string {
  return row.isUserCurrent ? 'font-bold text-primary' : ''
}
```

Replace the 6 template slots with column cell renderers using `meta` or just remove the slots entirely if UTable supports a row class. The simplest approach: use a `ui.tr` class based on the row:

Since UTable's `ui.tr` only accepts static strings (per CLAUDE.md), use the column `cell` property instead. Update the columns definition:

```typescript
const columns: TableColumn<DisplayRow>[] = [
  { accessorKey: 'base', header: 'Base', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.base) },
  { accessorKey: 'seat', header: 'Seat', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.seat) },
  { accessorKey: 'fleet', header: 'Fleet', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.fleet) },
  { accessorKey: 'displayRank', header: 'Rank', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.displayRank) },
  { accessorKey: 'displayTotal', header: 'Total', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, row.original.displayTotal) },
  { accessorKey: 'displayPercentile', header: 'TOP %', cell: ({ row }) => h('span', { class: highlightClass(row.original) }, `${row.original.displayPercentile}%`) },
]
```

Add `import { h } from 'vue'` at the top of the script.

Remove all 6 `<template #*-cell>` blocks from the template.

- [ ] **Step 2: Run typecheck**

Run: `npx vue-tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/BaseStatusTable.vue
git commit -m "refactor: replace 6 duplicate cell templates with column cell renderers in BaseStatusTable"
```

---

### Task 16: Extract Settings page cards into sub-components

**Files:**
- Create: `app/components/settings/SettingsProfileCard.vue`
- Create: `app/components/settings/SettingsPreferencesCard.vue`
- Create: `app/components/settings/SettingsEmailCard.vue`
- Create: `app/components/settings/SettingsPasswordCard.vue`
- Modify: `app/pages/settings.vue`

- [ ] **Step 1: Create SettingsProfileCard.vue**

```vue
<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Profile</h2>
    </template>

    <UForm :schema="UpdateProfileSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="Airline" name="icaoCode">
        <USelectMenu
          v-model="state.icaoCode"
          :items="airlineOptions"
          value-key="value"
          placeholder="Search airlines..."
          :loading="airlinesLoading"
          :search-input="{ placeholder: 'Search by name...' }"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Employee Number" name="employeeNumber">
        <UInput v-model="state.employeeNumber" placeholder="e.g. 12345" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Save profile</UButton>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { UpdateProfileSchema } from '#shared/schemas/settings'
import type { UpdateProfileState } from '#shared/schemas/settings'
import { normalizeEmployeeNumber } from '#shared/schemas/seniority-list'
import { useUserStore } from '~/stores/user'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const userStore = useUserStore()

const { options: airlineOptions, loading: airlinesLoading, load: loadAirlines } = useAirlineOptions()
await loadAirlines()

const loading = ref(false)
const state = reactive<UpdateProfileState>({
  icaoCode: userStore.profile?.icao_code ?? '',
  employeeNumber: userStore.profile?.employee_number ?? '',
})

async function onSave() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  loading.value = true
  const normalized = state.employeeNumber ? normalizeEmployeeNumber(state.employeeNumber) : ''
  const { error } = await supabase
    .from('profiles')
    .update({ icao_code: state.icaoCode, employee_number: normalized || null })
    .eq('id', userId)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await userStore.fetchProfile()
  toast.add({ title: 'Profile saved', color: 'success' })
}
</script>
```

- [ ] **Step 2: Create SettingsPreferencesCard.vue**

```vue
<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Preferences</h2>
    </template>

    <UForm :schema="UpdatePreferencesSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="Mandatory Retirement Age" name="mandatoryRetirementAge" hint="Affects all seniority projections">
        <UInput v-model.number="state.mandatoryRetirementAge" type="number" :min="55" :max="75" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Save preferences</UButton>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { UpdatePreferencesSchema } from '#shared/schemas/settings'
import type { UpdatePreferencesState } from '#shared/schemas/settings'
import { useUserStore } from '~/stores/user'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const userStore = useUserStore()

const loading = ref(false)
const state = reactive<UpdatePreferencesState>({
  mandatoryRetirementAge: userStore.profile?.mandatory_retirement_age ?? 65,
})

async function onSave() {
  const userId = user.value?.sub as string | undefined
  if (!userId) return

  loading.value = true
  const { error } = await supabase
    .from('profiles')
    .update({ mandatory_retirement_age: state.mandatoryRetirementAge })
    .eq('id', userId)
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  await userStore.fetchProfile()
  toast.add({ title: 'Preferences saved', color: 'success' })
}
</script>
```

- [ ] **Step 3: Create SettingsEmailCard.vue**

```vue
<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Email</h2>
    </template>

    <p class="text-sm text-muted mb-4">Current email: <strong>{{ user?.email }}</strong></p>

    <UForm :schema="ChangeEmailSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="New email address" name="newEmail">
        <UInput v-model="state.newEmail" type="email" placeholder="new@example.com" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Update email</UButton>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { ChangeEmailSchema } from '#shared/schemas/settings'
import type { ChangeEmailState } from '#shared/schemas/settings'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const loading = ref(false)
const state = reactive<ChangeEmailState>({ newEmail: '' })

async function onSave() {
  loading.value = true
  const { error } = await supabase.auth.updateUser({ email: state.newEmail })
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  state.newEmail = ''
  toast.add({ title: 'Confirmation link sent to your new email address', color: 'success' })
}
</script>
```

- [ ] **Step 4: Create SettingsPasswordCard.vue**

```vue
<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Password</h2>
    </template>

    <UForm :schema="ChangePasswordSchema" :state="state" class="space-y-4" @submit="onSave">
      <UFormField label="Current password" name="currentPassword">
        <UInput v-model="state.currentPassword" type="password" class="w-full" />
      </UFormField>
      <UFormField label="New password" name="password">
        <UInput v-model="state.password" type="password" class="w-full" />
      </UFormField>
      <UFormField label="Confirm new password" name="confirmPassword">
        <UInput v-model="state.confirmPassword" type="password" class="w-full" />
      </UFormField>
      <UButton type="submit" :loading="loading">Change password</UButton>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { ChangePasswordSchema } from '#shared/schemas/settings'
import type { ChangePasswordState } from '#shared/schemas/settings'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const loading = ref(false)
const state = reactive<ChangePasswordState>({
  currentPassword: '',
  password: '',
  confirmPassword: '',
})

async function onSave() {
  const email = user.value?.email
  if (!email) return

  loading.value = true

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: state.currentPassword,
  })

  if (signInError) {
    loading.value = false
    toast.add({ title: 'Current password is incorrect', color: 'error' })
    return
  }

  const { error } = await supabase.auth.updateUser({ password: state.password })
  loading.value = false

  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }

  state.currentPassword = ''
  state.password = ''
  state.confirmPassword = ''
  toast.add({ title: 'Password changed', color: 'success' })
}
</script>
```

- [ ] **Step 5: Rewrite settings.vue as a thin layout page**

```vue
<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Settings" />
    </template>

    <template #body>
      <div class="max-w-2xl mx-auto space-y-6 p-4 sm:p-6">
        <SettingsProfileCard />
        <SettingsPreferencesCard />
        <SettingsEmailCard />
        <SettingsPasswordCard />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'seniority', middleware: 'auth' })
</script>
```

- [ ] **Step 6: Run typecheck**

Run: `npx vue-tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add app/components/settings/ app/pages/settings.vue
git commit -m "refactor: extract settings page into 4 focused card components

settings.vue drops from 225 to ~15 lines. Each settings card is a
self-contained component with its own form state and submission logic."
```

---

## Chunk 6: Final Verification

### Task 17: Full test suite and typecheck

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Fix any failures**

If any test or type error appears, fix it before proceeding.

- [ ] **Step 4: Remove backwards-compatibility re-exports from seniority-list.ts**

Now that all consumers have been updated, check if any file still imports `normalizeDate`, `computeRetireDate`, or `isoDateRegex` from `#shared/schemas/seniority-list`. If none do (besides the re-export lines), remove the re-exports:

```bash
# Search for remaining consumers
grep -r "from.*schemas/seniority-list" --include="*.ts" --include="*.vue" | grep -v "test\." | grep -v "node_modules"
```

If `useSeniorityUpload.ts` still imports `isoDateRegex` from seniority-list, update it:
```typescript
// Change: import { SeniorityEntrySchema, isoDateRegex } from '#shared/schemas/seniority-list'
// To:     import { SeniorityEntrySchema } from '#shared/schemas/seniority-list'
//         import { ISO_DATE_REGEX } from '#shared/constants'
```
And update the usage from `isoDateRegex` to `ISO_DATE_REGEX`.

Once all consumers are updated, remove the re-export lines from `seniority-list.ts`.

- [ ] **Step 5: Run tests again after cleanup**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "refactor: remove backwards-compatibility re-exports from seniority-list.ts"
```

---

## Summary

| Task | Layer | Files Created | Files Modified | Key Change |
|---|---|---|---|---|
| 1 | Constants | 2 | 0 | ISO_DATE_REGEX, EXCEL_EPOCH_MS |
| 2 | Schemas | 2 | 0 | uuidField, withPasswordConfirmation |
| 3 | Schemas | 0 | 7 | Refactor admin/auth/settings to use common utils |
| 4 | Schemas | 0 | 2 (+ 2 deleted) | Merge profile.ts → settings.ts |
| 5 | Utils | 2 | 2 | Date utilities extraction |
| 6 | Utils | 2 | 0 | Seniority math extraction |
| 7 | Utils | 2 | 0 | Comparison logic extraction |
| 8 | Server | 2 | 0 | Validation helpers + error factories |
| 9 | Server | 0 | 6 | All routes use new helpers |
| 10 | Composables | 1 | 2 | useSignOut extraction |
| 11 | Composables | 0 | 2 | useDashboardStats rewire |
| 12 | Composables | 0 | 2 (+ 1 deleted) | useSeniorityCompare rewire |
| 13 | Store | 0 | 1 | currentListId ordering fix |
| 14 | Components | 2 | 1 | ComparisonTab + column definitions |
| 15 | Components | 0 | 1 | BaseStatusTable cell cleanup |
| 16 | Components | 4 | 1 | Settings card extraction |
| 17 | Verification | 0 | 1-2 | Full suite + cleanup |

**Total: ~20 new files, ~30 files modified, 3 files deleted**
