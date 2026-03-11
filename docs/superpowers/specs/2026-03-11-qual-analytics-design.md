# Design Spec: Pilot Qual Analytics & Insights

> **Status:** Approved
> **Created:** 2026-03-11
> **Scope:** P0 + P1 + P2 features from `docs.local/roadmap.md`

---

## Overview

A new `/analytics` page giving pilots a data-driven picture of qual demographics, upgrade projections, and movement history — all derived from existing seniority list data with no schema changes required.

---

## Scope — 8 Features

| Priority | Feature | Phase |
|----------|---------|-------|
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

- **Client-side** for all single-list analytics (Demographics tab, most Projections tab features) — data already in Pinia store via `fetchAllRows()`
- **Server-side** for cross-list analytics (Upgrade Tracker) — Nitro API route diffs multiple list snapshots without sending raw multi-list arrays to the browser

### New Files

```
app/
  pages/
    analytics.vue                        # New top-level page, tabbed layout
  composables/
    useQualDemographics.ts               # Demographics tab: 4 features
    useQualProjections.ts                # Projections tab: 3 features + assumptions state
    useQualUpgrades.ts                   # Upgrades tab: 2 features (client + server)
  components/analytics/
    AssumptionsBanner.vue                # Dismissible info banner (localStorage persist)
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
  upgrade-tracker.get.ts                 # Cross-list qual transition diffs

shared/utils/
  qual-analytics.ts                      # Pure math for all 8 features
  qual-analytics.test.ts                 # Co-located unit tests (node env)

supabase/
  fixtures/                              # Pre-generated seed SQL (committed)
  scripts/
    anonymize-csv.ts                     # Real CSV → anonymized CSV (not committed)
    generate-snapshots.ts                # Anonymized CSV → 4–6 list SQL inserts
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

### Qual Definition

`fleet + seat` = qual (e.g., `B737 CA`, `A320 FO`). All grouping uses this composite key.

---

## Tab 1 — Demographics

A qual filter (fleet + seat dropdowns + optional base filter) sits at the top and applies to all panels.

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
| B737 | 4,821 | Mar 2019 | 6.8 yrs |

- YOS computed client-side: `today - hire_date`
- If user's seniority number ≤ most junior CA for a fleet, that row is highlighted — "you could hold this today"

### 1.1 — Age Distribution per Qual (P1)

- Age derived from `retire_date - mandatory_retirement_age` (default 65 from `profiles`, per-user overridable)
- Group into 5-year age buckets, Chart.js bar chart per selected qual
- Stat chips below chart: median age, youngest, oldest
- Entries with null `retire_date` excluded; count shown in footnote

### 1.3 — Qual Size & Composition (P2)

Card grid — one card per fleet:
- Total pilots, CA count, FO count, CA:FO ratio
- Horizontal base-breakdown bar (e.g., "40% LAX · 30% JFK · 30% ORD")
- Clicking a card filters the age distribution and YOS charts to that qual

### Years of Service to Qual Entry (P1, new)

For each qual, compute YOS across all current holders. Display as box-plot or bar chart showing:
- Entry threshold (most junior holder's YOS = floor to get in)
- 25th percentile, median, 75th percentile, max YOS among holders

| Qual | Entry Floor | Median | Range |
|------|-------------|--------|-------|
| B737 CA | 6.8 yrs | 14.2 yrs | 6.8–24.1 yrs |

Answers: "I have 10 years — where does that put me among current B737 CAs?"

---

## Tab 2 — Projections

### Layout

```
[Seniority Power Index — full width]
[Retirement Wave chart (~55%)] | [Percentile Threshold Calculator (~45%)]
```

Clicking a Power Index cell pre-selects that qual in both Row 2 panels.

### Assumptions Banner

Dismissible `UAlert` (info variant) pinned to the top of the tab. Collapses to a single line after dismissal (persisted in `localStorage`).

> *These projections are based solely on scheduled retirements from the current seniority list. They do not account for new hires, pilot upgrades or downgrades, base size changes, furloughs, or non-retirement attrition. Treat all figures as directional estimates, not guarantees.*

Each projection widget additionally has an `i-lucide-info` tooltip with assumption details specific to that widget.

### 4.4 — Seniority Power Index (P1)

Heat map grid: rows = quals (fleet + seat), columns = bases. Each cell compares user's seniority number vs. most junior current holder in that qual+base:

- **Green** — user could hold it today
- **Amber** — within 10% gap of becoming holdable
- **Red** — not yet holdable

Year slider (1–10 years out) projects retirements forward and flips cells dynamically. Requires employee number — shows `EmployeeNumberBanner` otherwise.

### 2.3 — Retirement Wave per Qual (P0)

- Qual dropdown (or populated by Power Index cell click)
- Bar chart: retirement count per year within selected qual, next 10–15 years
- Overlaid line: user's projected percentile rank within that qual over same period
- "Wave years" (bars spiking above average) highlighted as upgrade opportunity windows
- Extends existing `RetirementProjectionChart` pattern with qual-scoped filter

### 2.1 — Percentile Threshold Calculator (P1)

- Inputs: target qual, optional base, target percentile (slider: 50% / 75% / 90%)
- Output: projected year user crosses that threshold, displayed as a range (±10% retirement variance)
- Copy: *"At current attrition, you could hold B787 CA at JFK in the top 50% by 2030–2032."*
- Uses `buildTrajectory()` from `seniority-math.ts` with qual filter

---

## Tab 3 — Upgrades

### Layout

```
[Upgrade Tracker — full width]
[What-If Simulator — full width]
```

### 3.1 — Upgrade Tracker (P2)

**Server-side.** `GET /api/analytics/upgrade-tracker?airlineId=xxx`

- Compares consecutive list snapshots by matching `employee_number` across dates
- Detects: FO→CA (upgrade), fleet change (lateral), CA→FO (downgrade/displacement)
- Returns pre-aggregated transition counts per type per interval — never raw entry arrays

Display:
- Summary stat row: total upgrades / laterals / downgrades across all tracked intervals
- Table: movement by fleet and transition type per date interval
- Line chart: upgrade velocity per fleet over time

Empty state when only one list exists: *"Upload seniority lists from different dates to begin tracking qual movement."*

### 3.3 — What-If Simulator (P2)

**Client-side.** User selects target qual (fleet + seat + optional base).

Single chart with two trajectory lines:
- **Current** — percentile rank within user's current qual (from `employee_number` row, if set)
- **Target** — projected percentile rank within chosen qual under current retirement assumptions

Summary callout: *"In 5 years, you'd be in the top 34% of B787 CAs vs. top 61% of your current B737 FO position."*

Falls back to overall list percentile for "current" if employee number not set, with explanatory note.

Reuses `buildTrajectory()` with qual filter — no new math.

---

## Seed Data Strategy

**Goal:** Realistic, anonymized multi-snapshot dataset that makes all 8 features non-trivial to display.

### Source Data

Two real ALPA seniority list exports are available in `docs.local/data/`:
- `alpa_q4_2024.csv` — Q4 2024 snapshot
- `2026_alpa_q1-correction.csv` — Q1 2026 correction

These serve as anchor snapshots 1 and 3 (approximately). 2–3 synthetic intermediates fill the gap.

### Process

1. **Anonymization script** (`supabase/scripts/anonymize-csv.ts`):
   - **Employee numbers** — generates a stable `realId → randomId` mapping (stored locally in `docs.local/`, never committed). Random IDs are consistent across all snapshots so the Upgrade Tracker join key works.
   - **Names** — replaced with `Pilot_XXXX` (keyed to random ID for consistency).
   - **Hire dates** — shifted per hiring class (batch shift): all pilots with the same original hire date receive the same random ±2-week offset, preserving class cohort structure while obscuring exact dates.
   - **Retire dates** — fuzzed per-pilot by a random ±90-day offset, preserving the general retirement curve shape without exposing exact dates.
   - Outputs anonymized CSVs to `supabase/fixtures/list-01.csv`, `supabase/fixtures/list-03.csv`

2. **Snapshot generation script** (`supabase/scripts/generate-snapshots.ts`):
   - Uses anonymized list-01 and list-03 as anchors
   - Generates 2–3 synthetic intermediate snapshots by:
     - Retiring pilots whose fuzzed `retire_date` falls within each interval (removes entries, shifts seniority numbers)
     - Upgrading a realistic percentage of FOs to CA (gives Upgrade Tracker real transitions)
     - Minor base reassignments on a small subset
   - Outputs pre-built SQL inserts to `supabase/fixtures/`

3. **Committed fixtures** loaded by `supabase/seed.sql` via `npm run db:reset`

### Existing Test Impact

Current tests assume a minimal seed shape. This release fixes them — each fix improves assertion quality by grounding tests in realistic data shapes rather than minimal stubs.

---

## Testing Strategy

### Unit Tests (`// @vitest-environment node`)

`shared/utils/qual-analytics.test.ts` — pure function coverage:
- Age derivation from `retire_date`
- Most-junior-CA lookup per fleet
- YOS distribution (min, p25, median, p75, max)
- Retirement wave counts per qual
- Percentile threshold projection
- Power index cell logic (holdable / amber / red)
- Upgrade transition detection (FO→CA, fleet change, downgrade)
- Trajectory comparison (current vs. target qual)

### Composable Tests

- `useQualDemographics.test.ts` — mock Pinia store with fixture entries, assert computed outputs
- `useQualProjections.test.ts` — same pattern + assumptions banner dismiss state
- `useQualUpgrades.test.ts` — mock store for What-If; mock `$fetch` for Upgrade Tracker server call

### Component Tests

Smoke-level: each analytics component mounts with mock props without throwing.

### E2E (`e2e/analytics.spec.ts`)

- Page loads; all three tabs are reachable
- Demographics: Most Junior CA table populates; age chart renders; YOS breakdown visible
- Projections: Power Index renders correct green/red cells for seeded user; Threshold Calculator produces output; assumptions banner visible
- Upgrades: Upgrade Tracker shows transition counts across seeded snapshots; What-If Simulator renders two trajectory lines

Requires: local Supabase running + full fixture seed loaded.

---

## Implementation Notes

- No schema changes needed — all Phase 1–2 analytics derived from existing columns
- `shared/utils/qual-analytics.ts` follows the same pure-function pattern as `seniority-math.ts`
- All new components are dumb (props in, events out); composables own all state
- The `AssumptionsBanner` dismiss state managed in `useQualProjections` via `localStorage`
- Parallel agent execution planned for independent features — Demographics, Projections, Upgrades, and seed data can be built concurrently
