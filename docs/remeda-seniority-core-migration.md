# Remeda migration plan for seniority core

This document proposes an incremental migration path for the seniority core toward Remeda-style data pipelines.

## Why this area first

The seniority core already has concentrated data-shaping logic in pure utility/composable functions, which makes it a safe place to adopt `pipe()` without touching persistence or UI behavior.

## Migration order (incremental)

### 1) Snapshot builders and set-like extraction (low risk, high readability)

**Files:** `app/utils/seniority-engine/snapshot.ts`

- `uniqueEntryValues` is a straightforward transform pipeline (pluck → compact/filter → unique → sort).
- Snapshot validation helpers (`collectDuplicateIssues`) can be migrated next by replacing imperative map-building loops with grouped pipelines while preserving error message format.

**Why first:** These functions are deterministic and heavily unit-tested, so regressions are easy to catch quickly.

---

### 2) Lens filtering and tabular projections (medium risk, high payoff)

**Files:** `app/utils/seniority-engine/lens.ts`

Best candidates:

- `upcomingRetirements` (filter/sort/map chain already present)
- `standing` cell breakdown generation (iterate groups, compute metrics, reduce totals)
- `retirementsThisYear` and derived filtered counts used by `standing`

**Why second:** This is where a lot of business logic lives and where pipeline readability can reduce branching complexity, but behavior correctness is critical.

---

### 3) Qual analytics and heavy transforms (medium/high risk, large long-term value)

**Files:** `app/utils/qual-analytics.ts`, `app/utils/seniority-math.ts`

Best candidates:

- Bucket and histogram generation
- Multi-step projection transforms
- Aggregation-heavy metrics for charts/cards

**Why third:** High data volume and denser transforms mean strong wins from consistent pipeline style, but these modules have the most interconnected calculations.

---

### 4) Composable-level derivations only where they remain pure (targeted)

**Files:** `app/composables/seniority/modules/useSeniorityCore.ts`

Best candidate:

- `syntheticEntry`’s max seniority number scan and option list derivations, when they stay as pure derived computations.

**Why last:** Keep composables focused on orchestration/reactivity; avoid over-functionalizing watcher and persistence orchestration.

## Guardrails for each migration PR

1. Keep each PR scoped to one function family.
2. Preserve public return shapes and error messages exactly.
3. Run focused tests first, then full gates:
   - `pnpm test app/utils/seniority-engine/snapshot.test.ts`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
4. Prefer `pipe()` for linear data flows; avoid forcing Remeda when a simple loop is clearer.

## First change completed in this branch

- Added `remeda` dependency.
- Migrated `uniqueEntryValues` in snapshot engine to a Remeda pipeline as the initial low-risk step.
- Migrated duplicate-validation flow in `collectDuplicateIssues` to grouped Remeda pipelines.
- Migrated `upcomingRetirements` in lens to a Remeda pipeline (`filter -> sortBy -> map`).
