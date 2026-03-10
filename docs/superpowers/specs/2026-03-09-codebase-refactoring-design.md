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
- `UUIDSchema` — replaces identical `AdminUserIdSchema` and `ResetUserPasswordSchema`
- `withPasswordConfirmation(baseSchema)` — reusable refinement for password + confirmPassword match; used by `SignUpSchema`, `RecoveryPasswordSchema`, `ChangePasswordSchema`

### Schema renames & merges
- `UpdatePasswordSchema` (auth.ts) → `RecoveryPasswordSchema` — used in recovery flow, not settings
- Delete `AdminUserIdSchema`, `ResetUserPasswordSchema` — replaced by `UUIDSchema`
- Merge `profile.ts` (single `UpdateEmployeeNumberSchema`) into `settings.ts`

### Tests
- Co-located tests for `common.ts` (UUIDSchema, withPasswordConfirmation)
- Update existing tests for renamed/moved schemas

---

## Layer 2: Shared Utils (Pure Logic Extraction)

### `shared/utils/seniority-math.ts` (new)
Extracted from `useDashboardStats.ts` (450 lines):
- `countRetiredAbove(entries, userSeniorityNumber, retireDate)`
- `generateTimePoints(startDate, endDate, intervalMonths)`
- `buildTrajectoryPoint(entries, userSeniorityNumber, targetDate)`
- `computeRank(entries, userSeniorityNumber, filterFn?)`
- `getProjectionEndDate(entries, retirementAge)`
- `computePercentile(rank, total)`

### `shared/utils/seniority-compare.ts` (new)
Extracted from `useSeniorityCompare.ts` (213 lines):
- `computeComparison(olderEntries, newerEntries)` → `{ retired, departed, qualMoves, rankChanges, newHires }`
- Interfaces: `RetiredPilot`, `DepartedPilot`, `QualMovePilot`, `RankChangePilot`, `NewHirePilot`

### `shared/utils/date.ts` (new)
Decomposed from `normalizeDate()` in `seniority-list.ts`:
- `parseExcelSerial(serial)` — Excel serial → YYYY-MM-DD
- `parseSlashDate(dateStr)` — MM/DD/YYYY variants → YYYY-MM-DD
- `normalizeDate(input)` — orchestrator trying each parser
- `computeRetireDate(dob, retirementAge)` — moved from seniority-list.ts
- `formatIsoDate(date)` — moved from seniority-list.ts

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

### `useSeniorityCompare.ts` (213 → ~40-50 lines)
- Imports `computeComparison` from `shared/utils/seniority-compare.ts`
- Keeps data fetching, calls pure function in `computed()`
- Same return shape

### `useSeniorityUpload.ts` (202 → ~120-140 lines)
- Lighter touch: import date utilities from `shared/utils/date.ts`
- No structural split — stepper state management is its legitimate concern

### `useSignOut.ts` (new, ~10 lines)
- Extracts duplicate sign-out logic from `AppHeader.vue` and `SeniorityNavbar.vue`
- Calls `supabase.auth.signOut()` + `navigateTo('/welcome')`

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

### Store fix
- Move `currentListId` to top of state declarations in `seniority.ts`

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

All existing schema files, all 7 server routes, 3 composables, `compare.vue`, `settings.vue`, `BaseStatusTable.vue`, `AppHeader.vue`, `SeniorityNavbar.vue`, `seniority.ts` store, plus test file updates.

---

## Out of Scope
- Test coverage gaps (store tests, server route tests, component tests) — separate effort
- File structure reorganization beyond what's described
- Performance optimizations
- Feature changes
