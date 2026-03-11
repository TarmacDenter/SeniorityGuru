# Design Spec: Pilot Qual Analytics & Insights

> **Status:** Approved
> **Created:** 2026-03-11
> **Scope:** P0 + P1 + P2 features from `docs.local/roadmap.md`

---

## Overview

A new `/analytics` page giving pilots a data-driven picture of qual demographics, upgrade projections, and movement history — all derived from existing seniority list data with no schema changes required.

---

## Scope — 8 Features

| Priority | Feature | Tab |
|----------|---------|-----|
| P0 | Most Junior CA per Qual (1.2) | Demographics |
| P0 | Retirement Wave per Qual (2.3) | Projections |
| P1 | Age Distribution per Qual (1.1) | Demographics |
| P1 | Years of Service to Qual Entry (new) | Demographics |
| P1 | Percentile Threshold Calculator (2.1) | Projections |
| P1 | Seniority Power Index (4.4) | Projections |
| P2 | Qual Size & Composition (1.3) | Demographics |
| P2 | Upgrade Tracker (3.1) | Upgrades |
| P2 | What-If Simulator (3.3) | Upgrades |

---

## Architecture

### Approach: Hybrid (client-side + server-side)

- **Client-side** — all single-list analytics (Demographics tab, most Projections tab features). Data already in Pinia store via `fetchAllRows()`.
- **Server-side** — cross-list analytics (Upgrade Tracker only). Nitro route diffs multiple list snapshots without sending raw multi-list arrays to the browser. Uses `serverSupabaseServiceRole()` — needs to read all users' list snapshots for the airline, which are not owned by the requesting user.

### Routing

`analytics.vue` uses `ssr: false` (consistent with `/seniority/*` pages). Auth middleware applies as normal. Because the route is CSR-only, middleware must call `client.auth.getClaims()` as a fallback (same pattern as other CSR pages).

### Qual Key

`fleet + seat` is the qual key throughout (e.g., `"737 CA"`, `"320 FO"`). **Base is always a filter/dimension, never part of the qual key.** This distinction is enforced across all grouping, display, and math functions.

### New Files

```
app/
  pages/
    analytics.vue                        # CSR page (ssr: false), tabbed layout
  composables/
    useQualDemographics.ts               # Demographics tab: 4 features
    useQualProjections.ts                # Projections tab: 3 features + assumptions banner state
    useQualUpgrades.ts                   # Upgrades tab: 2 features (client + server)
  components/analytics/
    AssumptionsBanner.vue                # Binds to useQualProjections dismiss state
    AgeDistributionChart.vue
    JuniorCaptainTable.vue
    YearsOfServiceBreakdown.vue
    QualCompositionCard.vue
    SeniorityPowerIndex.vue
    RetirementWaveChart.vue
    PercentileThresholdCalculator.vue
    UpgradeTracker.vue
    WhatIfSimulator.vue

server/api/analytics/
  upgrade-tracker.get.ts                 # Cross-list qual transition diffs (service role)

shared/utils/
  qual-analytics.ts                      # Pure math for all 8 features
  qual-analytics.test.ts                 # Co-located unit tests (node env)

supabase/
  fixtures/                              # Committed: anonymized CSVs + generated SQL
  scripts/
    anonymize-csv.ts                     # One-time dev tool: source CSV → anonymized CSV
    generate-snapshots.ts                # One-time dev tool: anonymized CSVs → fixture SQL
```

### Data Flow

```
analytics.vue
├─ Demographics tab → useQualDemographics → seniority store entries (already loaded)
├─ Projections tab  → useQualProjections  → seniority store entries + qual-analytics.ts
└─ Upgrades tab
   ├─ WhatIfSimulator → useQualUpgrades (client) → buildTrajectory() with qual filter
   └─ UpgradeTracker  → useQualUpgrades (server) → GET /api/analytics/upgrade-tracker
```

---

## Tab 1 — Demographics

A qual filter (fleet + seat dropdowns + optional base filter) sits at the top and applies to all panels below.

### Layout

```
[Qual filter bar]
[Most Junior CA table (~60%)] | [Qual Size & Composition (~40%)]
[Age Distribution chart (full width)]
[Years of Service Breakdown (full width)]
```

### 1.2 — Most Junior CA per Qual (P0)

Filter `seat = 'CA'`, group by `fleet`, find the pilot with the highest `seniority_number` per fleet. Display as sortable `UTable`:

| Fleet | Most Junior CA # | Hire Date | Years of Service |
|-------|-----------------|-----------|-----------------|
| 737 | 4,821 | Mar 2019 | 6.8 yrs |

- YOS computed client-side: `today - hire_date`
- If user's seniority number ≤ most junior CA for a fleet, that row is highlighted — "you could hold this today"

### 1.1 — Age Distribution per Qual (P1)

- Age derived from `retire_date - mandatory_retirement_age`. The viewing user's `mandatory_retirement_age` (default 65) is applied uniformly to all entries in the list — not per-pilot. This is a known approximation and noted in the UI footnote.
- Group into 5-year age buckets, Chart.js bar chart per selected qual
- Stat chips below chart: median age, youngest, oldest
- Entries with null `retire_date` excluded; count shown in footnote alongside the approximation note

### 1.3 — Qual Size & Composition (P2)

Card grid — one card per qual (fleet + seat):
- Total pilots, CA count, FO count, CA:FO ratio
- Horizontal base-breakdown bar (e.g., "40% LAX · 30% JFK · 30% ORD")
- Clicking a card filters the age distribution and YOS charts to that qual

### Years of Service to Qual Entry (P1, new)

For each qual (fleet + seat), compute YOS across all current holders. Display as grouped bar or box-plot:
- Entry threshold: YOS of the most junior current holder (floor to get in today)
- Distribution: p25, median, p75, max YOS among all current holders

| Qual | Entry Floor | p25 | Median | p75 |
|------|-------------|-----|--------|-----|
| 737 CA | 6.8 yrs | 11.2 yrs | 14.2 yrs | 19.4 yrs |

Answers: "I have 10 years — where does that put me among current 737 CAs?"

---

## Tab 2 — Projections

### Layout

```
[Assumptions banner]
[Seniority Power Index — full width]
[Retirement Wave chart (~55%)] | [Percentile Threshold Calculator (~45%)]
```

Clicking a Power Index cell pre-selects that qual in both Row 2 panels.

### Assumptions Banner

`AssumptionsBanner.vue` is a dumb component that binds to `{ isBannerDismissed, dismissBanner }` exposed by `useQualProjections`. The composable owns the dismiss state using `localStorage` directly (no external dependency — read on init, write on dismiss via a `ref` + watcher). This makes the state unit-testable via the composable without mounting the component.

Collapses to a single line after dismissal; persists across page reloads.

> *These projections are based solely on scheduled retirements from the current seniority list. They do not account for new hires, pilot upgrades or downgrades, base size changes, furloughs, or non-retirement attrition. Treat all figures as directional estimates, not guarantees.*

Each projection widget additionally has an `i-lucide-info` tooltip with assumption details specific to that widget.

### 4.4 — Seniority Power Index (P1)

Heat map grid: rows = quals (fleet + seat), columns = bases. Each cell computation:

```
holdable = (entries where fleet+seat = qual AND base = col AND retire_date <= today + sliderYears).length
           causes enough departures that user's seniority_number ≤ new most-junior holder
```

Concretely per cell: filter entries to `fleet+seat+base`, count how many have `retire_date <= projectionDate` AND `seniority_number < userSeniorityNumber`. If that count ≥ (total in cell - position of most-junior holder + 1), the cell flips. This is a simple count — does not use `buildTrajectory()`.

Cell states:
- **Green** — user could hold it at the projected date
- **Amber** — the number of additional retirements still needed to flip the cell is ≤ 10% of the total pilots in that qual+base cell (nearly holdable, e.g., 3 more retirements needed in a 30-pilot cell)
- **Red** — not holdable at the projected date

Year slider: 0–10 years, default 0 (today). Requires employee number — shows `EmployeeNumberBanner` otherwise.

### 2.3 — Retirement Wave per Qual (P0)

- Qual dropdown (or populated by Power Index cell click)
- Bar chart: count of entries with `retire_date` in each calendar year, filtered to selected qual
- Wave years (bars ≥ 1.5× the mean annual count) highlighted with a distinct color
- Overlaid line: user's projected percentile rank within the qual at each year-end — uses `buildTrajectory()` with a `filterFn` scoped to `fleet+seat` (and optionally `base`)
- Extends the existing `RetirementProjectionChart` pattern

### 2.1 — Percentile Threshold Calculator (P1)

- Inputs: target qual (fleet + seat), optional base filter, target percentile (slider: 50% / 75% / 90%)
- Computation:
  1. Run `buildTrajectory(entries, userSenNum, timePoints, qualFilter)` to get the user's projected percentile within the target qual at each time point
  2. Call `findThresholdYear(trajectory, targetPercentile)` — a new helper in `qual-analytics.ts`:
     - Signature: `findThresholdYear(trajectory: TrajectoryPoint[], targetPercentile: number): { year: string; optimistic: string; pessimistic: string } | null`
     - Returns the first time point where `point.percentile >= targetPercentile`
     - `optimistic`: result with retirement rate × 1.1 (10% faster attrition)
     - `pessimistic`: result with retirement rate × 0.9 (10% slower attrition)
     - Returns `null` if the threshold is never crossed in the projection window
  3. Variance range displayed as: *"by 2030–2032"* (pessimistic–optimistic)
- Copy: *"At current attrition, you could hold B787 CA at JFK in the top 50% by 2030–2032."*
- If `null`: *"Based on current data, this threshold is not projected to be reached within 15 years."*

---

## Tab 3 — Upgrades

### Layout

```
[Upgrade Tracker — full width]
[What-If Simulator — full width]
```

### 3.1 — Upgrade Tracker (P2)

**Server-side.** `GET /api/analytics/upgrade-tracker?airlineId=xxx`

Uses `serverSupabaseServiceRole()` — must read all list snapshots for an airline regardless of uploader. Auth is still verified via `serverSupabaseUser()`; the service role is used only for the cross-user query after identity is confirmed.

- Loads all `seniority_lists` for `airlineId`, ordered by `effective_date`
- For each consecutive pair, loads entries for both lists and matches by `employee_number`
- Detects per matched pilot: qual change (`fleet+seat` differs), categorized as:
  - **Upgrade** — FO → CA, same fleet
  - **Fleet change** — any fleet switch
  - **Downgrade** — CA → FO
- Returns pre-aggregated counts per transition type per interval — never raw entry arrays

Display:
- Summary stat row: total upgrades / laterals / downgrades across all tracked intervals
- Table: movement by fleet and transition type per date interval
- Line chart: upgrade velocity (upgrades per interval) per fleet over time

Empty state when fewer than 2 list snapshots exist for the airline: *"Upload seniority lists from different dates to begin tracking qual movement."*

### 3.3 — What-If Simulator (P2)

**Client-side.** User selects target qual (fleet + seat + optional base).

Single chart with two trajectory lines:
- **Current** — `buildTrajectory()` filtered to user's current qual (derived from their `employee_number` row in the active list, if set)
- **Target** — `buildTrajectory()` filtered to the chosen target qual

Both lines share the same Y-axis scale (percentile 0–100%). Summary callout below: *"In 5 years, you'd be in the top 34% of 787 CAs vs. top 61% of your current 737 FO position."*

Falls back to overall list percentile for "current" line if employee number not set, with explanatory note.

---

## Seed Data Strategy

**Goal:** Realistic, anonymized multi-snapshot dataset that makes all 8 features non-trivial to display.

Two source seniority list exports (different dates, approximately 5 quarters apart) serve as anchor snapshots. **Source file names and paths are never referenced in committed code or documentation.** Source files live in `docs.local/` which is git-ignored and never committed.

### Anonymization Rules

Applied by `supabase/scripts/anonymize-csv.ts` (one-time dev tool, not part of `db:reset`):

- **Employee numbers** — stable `realId → randomId` mapping generated once, stored in `docs.local/` (never committed). Consistent across all snapshots so cross-list joins work.
- **Names** — replaced with `Pilot_XXXX` keyed to the random ID.
- **Hire dates** — batch shift: all pilots with the same original hire date receive the same random ±2-week offset. Preserves hiring class cohort structure; individual dates are obscured.
- **Retire dates** — per-pilot random ±90-day offset. Preserves the retirement curve shape without exposing exact dates.

Output: anonymized CSVs committed to `supabase/fixtures/` (e.g., `snapshot-01.csv`, `snapshot-03.csv`). **Anonymized CSVs are committed** so they can be reused for future seeding without re-running the anonymization tool.

### Snapshot Generation

`supabase/scripts/generate-snapshots.ts` (one-time dev tool):
- Reads the committed anonymized CSVs as anchors
- Generates 2–3 synthetic intermediate snapshots:
  - Retires pilots whose fuzzed `retire_date` falls within each interval
  - Upgrades a realistic percentage of FOs to CA (seeds Upgrade Tracker with real transitions)
  - Minor base reassignments on a small subset
- Outputs SQL inserts to `supabase/fixtures/seed-seniority.sql`

### What Gets Committed

```
supabase/fixtures/
  snapshot-01.csv      # Anonymized CSV — committed, reusable
  snapshot-03.csv      # Anonymized CSV — committed, reusable
  seed-seniority.sql   # Generated SQL for all snapshots — committed, used by db:reset
```

### What Never Gets Committed

```
docs.local/            # Entire directory is git-ignored
  data/                # Source CSVs — never committed
  id-mapping.json      # realId → randomId mapping — never committed
```

`.gitignore` entry: `docs.local/`

### Seeding Integration

`supabase/fixtures/seed-seniority.sql` is loaded by updating `supabase/scripts/seed-seniority.js` to execute it. This replaces the existing minimal seniority seeder with the realistic fixture data. Running `npm run db:seed-seniority` (or `npm run db:seed-dev`) loads all snapshots deterministically — consistent with the existing seed script convention. The one-time anonymization and snapshot generation scripts do not need to be re-run.

### Existing Test Impact

Current tests assume a minimal seed shape. This release fixes them — each fix improves assertion quality by grounding tests in realistic data shapes rather than minimal stubs.

---

## Testing Strategy

### Unit Tests (`// @vitest-environment node`)

`shared/utils/qual-analytics.test.ts`:
- Age derivation from `retire_date` using viewer's `mandatory_retirement_age`
- Most-junior-CA lookup per fleet
- YOS distribution (min, p25, median, p75, max)
- Retirement wave counts per qual; wave year detection (≥ 1.5× mean)
- `findThresholdYear()` — returns correct year, optimistic, pessimistic; returns null when threshold unreachable
- Power Index cell computation — green/amber/red at varying projection years
- Upgrade transition detection: FO→CA, fleet change, downgrade
- Trajectory comparison (current vs. target qual)

### Composable Tests

- `useQualDemographics.test.ts` — mock Pinia store entries, assert computed outputs match expected shapes
- `useQualProjections.test.ts` — same + assert `isBannerDismissed` toggles correctly via `dismissBanner()`
- `useQualUpgrades.test.ts` — mock store for What-If; mock `$fetch` for Upgrade Tracker server call

### Component Tests

Smoke-level: each analytics component mounts with mock props without throwing.

### E2E (`e2e/analytics.spec.ts`)

- Page loads; all three tabs are reachable
- Demographics: Most Junior CA table populates; age chart renders; YOS breakdown visible
- Projections: Power Index renders correct green/red cells for seeded user; Threshold Calculator produces output; assumptions banner visible and dismissible
- Upgrades: Upgrade Tracker shows transition counts across seeded snapshots; What-If Simulator renders two trajectory lines

Requires: local Supabase running + `npm run db:reset` with fixture seed loaded.

---

## Implementation Notes

- No schema changes needed — all Phase 1–2 analytics derived from existing columns
- `shared/utils/qual-analytics.ts` follows the same pure-function, zero-dependency pattern as `seniority-math.ts`
- All analytics components are dumb (props in, events out); composables own all state and computation
- `AssumptionsBanner` dismiss state owned by `useQualProjections` (composable exposes `{ isBannerDismissed, dismissBanner }`); component binds to these — state is unit-testable without mounting the component
- Auto-import prefix for `app/components/analytics/` components is `Analytics` (e.g., `<AnalyticsJuniorCaptainTable>`)
- Parallel agent execution planned: Demographics composable + components, Projections composable + components, Upgrades composable + components, and seed tooling can all be built concurrently
- `docs.local/` is git-ignored; source file names are never referenced in committed code or documentation
