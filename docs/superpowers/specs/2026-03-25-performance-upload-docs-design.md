# Performance, Upload Pipeline & Documentation — Design Spec

**Date:** 2026-03-25
**Status:** Draft

---

## 1. Problem Statement

With seniority lists reaching 17,000 entries (e.g., Delta Air Lines), the app exhibits general sluggishness across the board: initial dashboard load, tab switching, control interactions (growth slider, qual filters), and the compare page. Additionally, the upload pipeline lacks multi-sheet XLSX support, preamble handling in the generic parser, and progress feedback. Finally, the app needs documentation for supported data formats and a contributor onboarding path for open-sourcing the parser system.

---

## 2. Workstream 1: Performance

### 2.1 Lens-Level Memoization

**Problem:** Lens methods (`trajectory()`, `demographics()`, `holdability()`, etc.) are pure functions of `(snapshot, anchor, scenario)` but have no caching. `useTrajectory` alone calls `lens.trajectory()` three times with the same scenario — once each for `chartData`, `fullTrajectory`, and `deltas` — each triggering a full `buildTrajectory()` pass over all entries.

**Solution:** Last-one-wins memoization on each lens method. Each method caches its most recent `(args → result)` pair. If the next call has the same arguments, it returns the cached result. If arguments differ, it recomputes and replaces the cache entry.

**Key design decisions:**
- **Cache key:** Stable serialization of the scenario argument (e.g., `JSON.stringify`). Scenarios are small plain objects — serialization cost is negligible.
- **Cache scope:** Per-lens instance. When `useSeniorityCore` creates a new lens (because entries or anchor changed), the old cache is garbage collected with the old lens. No manual invalidation needed.
- **Cache size:** Exactly one entry per method (last-one-wins). This solves the triple-call redundancy without unbounded memory growth.
- **No cache sharing across lens instances.** Each lens is a closure over a specific snapshot + anchor. A new lens means new data — stale caches from old lenses are useless.

**Affected lens methods:**
- `standing()`
- `trajectory(scenario)`
- `compareTrajectories(scenarioA, scenarioB)`
- `percentileCrossing(targetPercentile, scenario)`
- `holdability(scenario)`
- `qualScales(scenario)`
- `retirementWave(scenario)`
- `retirementProjection(scenario)`
- `demographics(mandatoryAge, scenario)`

**Methods NOT memoized:**
- `upcomingRetirements(filter)` — filter object is user-driven and changes frequently; the computation is a simple filter+sort, not expensive.

### 2.2 In-Memory Entry Cache for Compare Page

**Problem:** The compare page loads two full lists from Dexie via `getEntriesForList()`. At 17k entries per list, the IndexedDB deserialization is the bottleneck — not the comparison computation itself (`computeComparison` is a single O(n) pass with Map lookups).

**Solution:** Cache loaded list entries in the seniority store keyed by `listId`. Once list #5's entries are loaded, switching away and back doesn't re-read from Dexie.

**Key design decisions:**
- **Cache location:** `useSeniorityStore` — a `Map<number, SeniorityEntry[]>` alongside existing state.
- **Invalidation:** Clear the entry for a listId when that list is deleted. Clear all when `clearStore()` is called.
- **No size limit.** Seniority lists are the app's core data — users typically have 2–5 lists. Caching all loaded entries is fine.
- **Store method change:** `getEntriesForList(listId)` checks the cache before querying Dexie.

### 2.3 Per-Section Skeleton Loading

**Problem:** Dashboard tabs show a single loading state gated on `entriesLoading`, but individual sections (trajectory chart, demographics, retirement wave) compute at different speeds. With memoization, cached sections resolve instantly while uncached ones still take time.

**Solution:** Each expensive section in the dashboard tabs manages its own loading state. Sections that resolve from cache appear immediately; sections computing for the first time show a skeleton placeholder.

**Implementation approach:** The composables (`useTrajectory`, `useQualAnalytics`) already return computed refs. The skeleton state is driven by whether the computed has resolved to a non-null value. No explicit loading flags needed — Vue's reactivity handles it. The existing skeleton markup in `TrajectoryTab.vue` and `DemographicsTab.vue` just needs its `v-if` condition updated from the single `loading` prop to per-section null checks.

---

## 3. Workstream 2: Upload Pipeline Improvements

### 3.1 Multi-Sheet XLSX Support

**Problem:** `useSeniorityUpload.parseFile()` silently grabs the first sheet (`workbook.SheetNames[0]`). Multi-sheet XLSX files are common in airline data exports.

**Solution:** When `workbook.SheetNames.length > 1`, show a sheet picker dropdown and let the user select which sheet to parse. When there's only one sheet, proceed automatically (current behavior).

**Implementation:**
- Add `sheetNames: ref<string[]>([])` and `selectedSheet: ref<string | null>(null)` to the upload composable.
- `parseFile()` reads the workbook, populates `sheetNames`, and if multiple sheets exist, pauses for user selection.
- A new `selectSheet(name)` method continues the pipeline with the chosen sheet.
- The upload page shows a `USelectMenu` for sheet selection between file upload and the column mapper step.

### 3.2 Generic Parser Preamble Heuristic

**Problem:** The generic parser passes rows through as-is. CSVs with title rows (e.g., "Seniority List 01MAR2026") and blank rows before the actual header row cause the header to be misidentified.

**Solution:** Heuristic detection — scan rows top-down, skip blank rows and rows with only 1–2 non-empty cells (likely title/metadata rows), treat the first row with 5+ non-empty cells as the header.

**Implementation:**
- Add a `findHeaderRow(rows: string[][]): number` function to the generic parser.
- The threshold of 5 non-empty cells is chosen because the minimum required columns (seniority number, employee number, seat, base, fleet, hire date, retire date) is 7. A header row will have at least that many. Title rows rarely have more than 2–3 populated cells.
- Rows before the detected header are discarded. If no row meets the threshold, fall back to row 0 (current behavior).
- Extract metadata from preamble rows (title, effective date) using a pattern similar to Delta's `extractMetadata`, but with a more generic date-detection regex.

### 3.3 Batch Processing with Progress Reporting

**Problem:** For 17k-row lists, `applyColumnMap()` and `validate()` run synchronously on the main thread with no progress feedback.

**Solution:** Break row processing into batches, yielding to the event loop between batches, and reporting progress via reactive refs.

**Implementation:**
- `applyColumnMap` and `validate` become async, processing rows in batches (e.g., 500 rows per tick).
- Between batches, `await nextTick()` or `setTimeout(0)` to yield to the UI thread.
- New reactive refs in the upload composable:
  - `processingPhase: ref<'idle' | 'reading' | 'parsing' | 'mapping' | 'validating'>('idle')`
  - `processingProgress: ref<{ current: number; total: number } | null>(null)`
- The upload page shows:
  - Indeterminate spinner during `reading` and `parsing` phases (opaque library calls).
  - Determinate progress bar during `mapping` and `validating` phases.

### 3.4 Robust Error Handling

**Problem:** Upload errors surface as generic strings. Users need clear, actionable error messages at every stage.

**Solution:** Each pipeline stage wraps its work in try/catch and surfaces stage-specific error messages:

| Stage | Example Error | User Message |
|-------|--------------|--------------|
| File read (`XLSX.read`) | Corrupt file | "Failed to read file. It may be corrupt or unsupported. Supported formats: .csv, .xlsx, .xls" |
| Sheet selection | No sheets | "This file contains no data sheets." |
| Pre-parser | Header not found | "Could not find a header row. Check that your file contains column headers." |
| Column mapping | Required col missing | "Could not auto-detect column: Base. Please map it manually." |
| Validation | Row errors | Summary banner: "247 of 17,000 rows have validation errors. Fix or remove them to continue." |

All errors are also written to the debug log (see Workstream 3).

---

## 4. Workstream 3: Logging & Debug Export

### 4.1 In-Memory Ring Buffer

**Problem:** The existing logger (`app/utils/logger.ts`) writes structured JSON to `console.*` only. There's no way to export logs for bug reporting.

**Solution:** Add an in-memory ring buffer backing the existing `createLogger` API. The `emit()` function pushes to the buffer in addition to console output.

**Design:**
- **Buffer size:** 500 entries (configurable). At ~200 bytes per entry, this is ~100KB — negligible.
- **Ring behavior:** When full, oldest entries are overwritten.
- **API additions to `logger.ts`:**
  - `getLogBuffer(): LogEntry[]` — returns a copy of the buffer contents, oldest first.
  - `clearLogBuffer(): void` — clears the buffer.
  - `exportLogAsText(): string` — formats the buffer as a human-readable text block.
- **No persistence.** Logs are lost on page refresh. This is acceptable for now — the user exports during the session where the problem occurred.

### 4.2 Export UI

**Two locations:**

1. **Settings page** — a new "Debug Log" card with a "Download Debug Log" button. Always accessible. Downloads a `.txt` file via `URL.createObjectURL`.
2. **Inline with errors** — when the upload pipeline or other operations surface an error, include a "Download Debug Log" link alongside the error message. Same mechanism, just contextually placed.

---

## 5. Workstream 4: Landing Page & Contributor Documentation

### 5.1 Landing Page — Supported Formats Section

Add a new section to the landing page (`/`) between the feature overview and the CTA:

- **"Supported Airlines"** — list Delta Air Lines as directly supported (auto-parses Category column, extracts effective date from preamble). Generic/Other as the fallback with manual column mapping.
- **"Required Data Format"** — brief list of required columns: Seniority Number, Employee Number, Seat, Base, Fleet, Hire Date, Retire Date. Optional: Name.
- **Example table** — 3–4 rows of fabricated sample data showing the expected format. Expandable/collapsible.
- **"Your airline not listed?"** CTA — two paths:
  - "Open a GitHub issue" — link to `https://github.com/TarmacDenter/SeniorityGuru/issues/new` with a pre-filled title like "Parser request: [Airline Name]"
  - "Email me" — contact address for non-technical users

### 5.2 How It Works Page — Expanded Format Details

Expand `/how-it-works` with a "Data Compatibility" section:

- Detailed breakdown of each supported parser (Delta, Generic)
- What each parser expects (column names, preamble format, Category column semantics for Delta)
- How the column mapper works for generic formats
- Tips for exporting data from airline systems (e.g., "Export the Seniority sheet as a single-sheet XLSX or CSV")
- Link back from the landing page's brief summary

### 5.3 CONTRIBUTING.md

Create `CONTRIBUTING.md` in the repo root covering:

1. **Project overview** — what the app does, local-first architecture, no server
2. **Parser system overview** — the `PreParser` interface, how pre-parsers normalize airline-specific data into the standard column format
3. **Step-by-step: Adding a new parser**
   - Create `app/utils/parsers/<airline>.ts` implementing `PreParser`
   - Register in `app/utils/parsers/registry.ts`
   - Write tests alongside the parser file
   - The `PreParser` interface contract: `id`, `label`, `description`, `icon`, `formatDescription`, `parse(raw: string[][]): PreParserResult`
4. **Testing a parser** — how to run tests, what to validate (header detection, metadata extraction, column mapping, edge cases)
5. **Code conventions** — link to `CLAUDE.md` for architecture rules, TypeScript strict mode, Nuxt conventions
6. **Submitting a PR** — branch naming (`feature/parser-<airline>`), commit format, quality gates (`npm run lint && npm run typecheck && npm test`)

---

## 6. Out of Scope

- **Web Workers** — not included in this iteration. Memoization + batched processing addresses the immediate performance issues. Workers can be evaluated later if benchmarks at 17k entries show first-time computations still blocking the UI noticeably.
- **IndexedDB-backed log persistence** — deferred. In-memory ring buffer is sufficient for current needs.
- **GitHub issue templates** — not needed yet.
- **Auto-detection of which parser to use** — users select the parser explicitly.
- **Parser interface changes** — the existing `PreParser` interface is sufficient. No breaking changes.

---

## 7. Dependencies Between Workstreams

The four workstreams are **independent** and can be developed in parallel:

- **Workstream 1** (Performance) touches `seniority-engine/lens.ts`, `stores/seniority.ts`, and dashboard tab components.
- **Workstream 2** (Upload) touches `parsers/generic.ts`, `useSeniorityUpload.ts`, `parse-spreadsheet.ts`, and the upload page.
- **Workstream 3** (Logging) touches `utils/logger.ts`, the settings page, and error display components.
- **Workstream 4** (Docs) touches `pages/index.vue`, `pages/how-it-works.vue`, and creates `CONTRIBUTING.md`.

No file conflicts between workstreams — they are safe to implement as parallel agents in separate worktrees.
