# Codebase Refactoring — Design Spec

**Date:** 2026-03-09
**Scope:** Deep clean — extract reusable utilities, deduplicate schemas/components, improve naming, address test gaps
**Approach:** Layer-by-layer with TDD (bottom-up, each slice tested before moving on)

---

## Decisions

| Question | Choice |
|---|---|
| Scope | Deep clean (C) — full refactoring including renaming, file reorganization, test gaps |
| Pure logic location | Split (C) — domain logic to `shared/utils/`, UI helpers to `app/utils/` |
| Server route cleanup | Validation + error factories (B) — helpers that throw on failure, no handler wrapper |
| Renaming threshold | Fix only genuinely misleading names (A) — ~5-8 renames |
| Ordering | Layer-by-layer with TDD (Approach 3) — shared → server → app utils → composables → components |

---

## Layer 1: Shared Schemas & Constants

### `shared/constants.ts` (new)
- `ISO_DATE_REGEX` — replace hardcoded `/^\d{4}-\d{2}-\d{2}$/` in 3 schema files
- `EXCEL_EPOCH` — replace `Date.UTC(1899, 11, 30)` magic number in `normalizeDate()`

### `shared/schemas/common.ts` (new)
- `uuidField()` — reusable `z.string().uuid()` builder. `AdminUserIdSchema` and `ResetUserPasswordSchema` share the same UUID validation but wrap different field names (`id` vs `userId`), so they each keep their own `z.object()` calling `uuidField()` internally
- `withPasswordConfirmation<T>(baseSchema)` — generic refinement for password + confirmPassword match; must accept any `ZodObject` whose shape includes `{ password, confirmPassword }`. Used by `SignUpSchema`, `RecoveryPasswordSchema`, `ChangePasswordSchema`

### Schema renames & merges
- `UpdatePasswordSchema` (auth.ts) → `RecoveryPasswordSchema` — used in recovery flow, not settings
- Simplify `AdminUserIdSchema` and `ResetUserPasswordSchema` to use `uuidField()` (keep both — different field names)
- Merge `profile.ts` into `settings.ts` — keep `UpdateEmployeeNumberSchema` as a distinct schema (it requires `min(1)` for the inline employee-number form, vs `UpdateProfileSchema.employeeNumber` which allows empty). Merging the file avoids the two-file confusion while preserving both validation rules

### Tests
- Co-located tests for `common.ts` (`uuidField`, `withPasswordConfirmation`)
- Update existing tests for renamed/moved schemas
- Move `profile.test.ts` assertions into `settings.test.ts`

---

## Layer 2: Shared Utils (Pure Logic Extraction)

### `shared/utils/seniority-math.ts` (new)
Moved from `useDashboardStats.ts` (450 lines) — these functions already exist at module scope, they just need to move to `shared/utils/` for reusability and testability:
- `countRetiredAbove(entries, userSeniorityNumber, retireDate)` (already exported)
- `generateTimePoints(startDate, endDate)` (already exported)
- `buildTrajectory(entries, userSeniorityNumber, filterFn?)` (already exported — note: NOT `buildTrajectoryPoint`)
- `computeRank(entries, userSenNum)` (currently private — newly exported)
- `getProjectionEndDate(retireDate)` (currently private — newly exported)
- `computeRetirementProjection(entries, filterFn?)` (currently private inside composable — extract)
- `computeComparativeTrajectory(entries, filterFnA, filterFnB, timePoints)` (currently private inside composable — extract)

### `shared/utils/seniority-compare.ts` (new)
Moved from `useSeniorityCompare.ts` (213 lines) — `computeComparison` is already a standalone exported function at module scope, it just needs to move files:
- `computeComparison(olderEntries, newerEntries)` → `{ retired, departed, qualMoves, rankChanges, newHires }`
- Interfaces: `RetiredPilot`, `DepartedPilot`, `QualMove`, `RankChange`, `NewHire`, `CompareResult`
- Note: `compare.vue` imports these types directly and will need its import path updated

### `shared/utils/date.ts` (new)
Moved from `seniority-list.ts` — `normalizeDate()` is 30 lines with sequential if-blocks (not deeply nested), but grouping all date logic in one utility file improves discoverability:
- `parseExcelSerial(serial)` — Excel serial → YYYY-MM-DD (extracted from inline block in `normalizeDate`)
- `parseSlashDate(dateStr)` — MM/DD/YYYY variants → YYYY-MM-DD (extracted from inline block)
- `normalizeDate(input)` — orchestrator calling each parser
- `computeRetireDate(dob, retirementAge)` — moved from seniority-list.ts
- `formatDate(date, utc?)` — moved from seniority-list.ts (currently private, now exported; keeping original name)
- Note: `useSeniorityUpload.ts` imports `isoDateRegex` from `seniority-list.ts` — after `isoDateRegex` moves to `shared/constants.ts`, that import must be updated

### Tests
- Move relevant tests from `useDashboardStats.test.ts` and `useSeniorityCompare.test.ts`
- New tests for decomposed date parsers
- All files use `@vitest-environment node`

---

## Layer 3: Server Utils

### `server/utils/validation.ts` (new)
- `validateRouteParam<T>(event, paramName, schema)` — parse + throw 422 on failure
- `validateBody<T>(event, schema)` — parse + throw 422 on failure

### `server/utils/errors.ts` (new)
- `throwValidationError(issues)` — 422 with Zod issues
- `throwNotFound(resource)` — 404
- `throwForbidden(message?)` — 403

### Route updates
All 7 API routes updated to use helpers. Each route loses ~15-20 lines of validation boilerplate.

---

## Layer 4: App Utils (UI Helpers)

### `app/utils/chart-builders.ts` (new)
- `buildRetirementDatasets(entries, scopeA, scopeB, asPercentage)` — Chart.js datasets for retirement comparison
- `buildTrajectoryDatasets(entries, scopeA, scopeB, timePoints)` — Chart.js datasets for seniority comparison

### `app/utils/column-definitions.ts` (new)
- `retiredColumns`, `departedColumns`, `qualMoveColumns`, `rankChangeColumns`, `newHireColumns`
- Static column definition arrays extracted from `seniority/compare.vue`

### Tests
- `chart-builders.test.ts` — tests conditional logic (percentage conversion, scope filtering)
- Column definitions are static data, no tests needed

---

## Layer 5: Composables (Thin Wrappers)

### `useDashboardStats.ts` (450 → ~80-100 lines)
- Imports pure functions from `shared/utils/seniority-math.ts`
- Wires reactive data to functions via `computed()`
- Same public API — no consumer changes

### `useSeniorityCompare.ts` (213 → ~75 lines)
- Imports `computeComparison` and interfaces from `shared/utils/seniority-compare.ts`
- Keeps data fetching (~72 lines of composable wrapper), calls pure function in `computed()`
- Same return shape — consumers re-export types from the new location

### `useSeniorityUpload.ts` (202 → ~120-140 lines)
- Lighter touch: import date utilities from `shared/utils/date.ts`
- No structural split — stepper state management is its legitimate concern

### `useSignOut.ts` (new, ~10 lines)
- Extracts duplicate sign-out logic from `AppHeader.vue` and `SeniorityNavbar.vue`
- Calls `supabase.auth.signOut()` + `navigateTo('/auth/login')` (matches current behavior in both components)

### No changes to
- `useTableFeatures.ts`, `useScopeFilter.ts`, `useSupabase.ts`, `useAirlineOptions.ts`, `useSeniorityNav.ts`

---

## Layer 6: Components & Pages

### `ComparisonTab.vue` (new, ~40 lines)
- Props: `columns`, `rows`, `searchPlaceholder`
- Internals: `useTableFeatures()`, renders search + UTable + pagination
- Replaces 5 identical tab structures in `seniority/compare.vue` (285 → ~100 lines)

### `BaseStatusTable.vue` cell cleanup
- Replace 6 identical cell slot templates with computed `cellClass(row)` function
- Reduces ~30 lines of template repetition

### Settings page extraction
- `SettingsProfileCard.vue` (~40-50 lines) — airline + employee number
- `SettingsPreferencesCard.vue` (~40-50 lines) — retirement age
- `SettingsEmailCard.vue` (~40-50 lines) — email change
- `SettingsPasswordCard.vue` (~40-50 lines) — password change
- `settings.vue` becomes layout page (~30 lines) rendering 4 cards

### Store fix (`seniority.ts`)
- Move `currentListId` declaration above `fetchEntries` — it is currently referenced in `fetchEntries` (line 40) before being declared (line 56), a forward reference that works due to hoisting but harms readability

---

## Files Created

| File | Layer |
|---|---|
| `shared/constants.ts` | 1 |
| `shared/schemas/common.ts` | 1 |
| `shared/schemas/common.test.ts` | 1 |
| `shared/utils/seniority-math.ts` | 2 |
| `shared/utils/seniority-math.test.ts` | 2 |
| `shared/utils/seniority-compare.ts` | 2 |
| `shared/utils/seniority-compare.test.ts` | 2 |
| `shared/utils/date.ts` | 2 |
| `shared/utils/date.test.ts` | 2 |
| `server/utils/validation.ts` | 3 |
| `server/utils/errors.ts` | 3 |
| `app/utils/chart-builders.ts` | 4 |
| `app/utils/chart-builders.test.ts` | 4 |
| `app/utils/column-definitions.ts` | 4 |
| `app/composables/useSignOut.ts` | 5 |
| `app/components/ComparisonTab.vue` | 6 |
| `app/components/SettingsProfileCard.vue` | 6 |
| `app/components/SettingsPreferencesCard.vue` | 6 |
| `app/components/SettingsEmailCard.vue` | 6 |
| `app/components/SettingsPasswordCard.vue` | 6 |

## Files Deleted

| File | Reason |
|---|---|
| `shared/schemas/profile.ts` | Merged into `settings.ts` |
| `shared/schemas/profile.test.ts` | Tests moved to `settings.test.ts` |

## Files Modified

All existing schema files, all 7 server routes, 3 composables (`useDashboardStats.ts`, `useSeniorityCompare.ts`, `useSeniorityUpload.ts`), `compare.vue`, `settings.vue`, `app/components/dashboard/BaseStatusTable.vue`, `AppHeader.vue`, `SeniorityNavbar.vue`, `seniority.ts` store, plus test file updates. `useSeniorityUpload.ts` needs import path update for `isoDateRegex` (moving to `shared/constants.ts`).

---

## Out of Scope
- Test coverage gaps (store tests, server route tests, component tests) — separate effort
- File structure reorganization beyond what's described
- Performance optimizations
- Feature changes
