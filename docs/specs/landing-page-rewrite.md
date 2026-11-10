# Landing page rewrite

Baseline: `main` at be48057. Integration branch: `claude/nice-dirac-jepiwz`.

## Outcome

The landing page (`app/pages/index.vue`) answers the four questions a pilot opens SeniorityGuru for, in order, each with the real dashboard presentation computed by the real engine from the bundled demo list:

1. Where am I on the list today?
2. When can I hold each Qualification (especially Captain)?
3. Which retirements move me, and how far?
4. What changed since the last list?

Privacy and import support are stated once each, below the showcase. The page stops shipping fabricated chart data.

## Problems this fixes

- Hero leads with privacy; the first chart sits ~2,500px down a 6,860px page (1280px wide).
- `useLandingDemo.ts` and `demo/TrajectoryDemo.vue` hold hand-written figures and a private projection model. They disagree with the demo list behind "View Demo" (E175/A320, DEN/ORD, 4,892 pilots vs 220/320, BOS/JFK/MCO, 3,003 pilots).
- The app's strongest views (Your line on the Seniority List, Holdability, Retirement Wave with the percentile overlay) are absent.
- Inline "about this view" paragraphs, all-caps headers and red/amber row fills break `docs/design-system.md`.
- Privacy is stated four times; the feature-card grid repeats the demos.

## Non-goals

- No change to seniority calculations, the engine, or the facade's results.
- No change to the dashboard's routes or the "View Demo" flow (`app/hooks/demo-enter.ts`).
- The landing page never writes to Dexie. Only "View Demo" stores the demo lists.

## Architecture

### Injected seniority core (foundation, ticket 0)

The dashboard composables (`useStanding`, `useListExcerpt`, `useHoldability`, `useNextProjections`, `useTrajectory`, `useQualificationPositions`) all read `useSeniorityCore()`, whose analysis is built from the store. The landing page reuses those composables unchanged by providing its own core.

- `useSeniorityCore.ts` exports `SENIORITY_CORE_KEY` (an `InjectionKey`) and `provideSeniorityCore(core)`. `useSeniorityCore()` returns the injected core when one is provided (check `getCurrentInstance()` before `inject` so non-component callers keep working), before any store or singleton work.
- The injected core has the same return shape as `useSeniorityCore()`. Its `newHire` controls are inert (disabled, no-op `reset`).
- The core carries an optional `stateKey` prefix. `useScenario` and `useNextProjections` prefix their `useState` keys with it, so the landing showcase never shares Qualification Scope, Growth Assumptions or the compare-scope overlay with the dashboard.
- `app/composables/useLandingShowcase.ts` (new):
  - On the client, lazily `import()`s `~/utils/demo-assets` and `~/utils/demo-parser`, parses both demo CSVs, converts with `localEntryToSeniorityEntry`.
  - Builds `createSeniorityAnalysis({ entries, asOfDate: todayPlainDate() })` from the current demo list and anchors on `DEMO_EMPLOYEE_NUMBER`. One As-of Date, today (ADR 0010).
  - Provides the core via `provideSeniorityCore` with `stateKey: 'landing:'`.
  - Exposes `ready` (boolean ref), `error`, and `diffRows` (from `computeComparison(base, current, currentEffectiveDate)` then `buildDiffRows(..., { includeSeniorityNumberChanges: true })`).
- `app/components/landing/LandingShowcase.vue` (new): calls `useLandingShowcase()` and renders its default slot only once `ready`; shows `USkeleton` blocks while loading. Every showcase section is a child of it, so their composables resolve the injected core.

### Section components (tickets 1–3)

New components live in `app/components/landing/`. Each:

- Takes data only from the dashboard composables (through the injected core) or `useLandingShowcase`. No fabricated figures.
- Reuses the dashboard's presentational components (`SeniorityAnchoredTable`, `DashboardTrajectoryChart`, `AnalyticsRetirementWaveChart`, the holdability table markup, `ComparisonDiffTab`). If the needed markup lives only inside a dashboard tab, extract it into a component both use. Do not copy tab markup.
- Sits in one stock `UCard`. Explanations go behind an info `UPopover`, never inline paragraphs.
- Carries a small caption: "Sample pilot from the demo list" (or "Demo lists" for comparison).
- Uses CONTEXT.md terms: Rank today, Seniority Number, Roster Size, Seniority Percentile, Qualification, Holdable.
- Has a mounted test next to it that asserts text a pilot reads.
- Links to the matching dashboard view through the "View Demo" flow, not to `/dashboard/...` directly (a visitor has no list stored). Emit an `open-demo` event; the page owns the handler.

## Page layout (ticket 4, integration)

Order, top to bottom:

1. **Hero.** Headline about the outcome ("See where you'll be on the seniority list in 5, 10 and 20 years."). One line of support copy. Buttons: View Demo (primary, solid), Open Dashboard (soft), Install App (ghost). One muted line: "Stays on your device · No account · Works offline · Open source". The trajectory chart card (ticket 1) beside the copy on desktop, below it on phones.
2. **Where you stand today** (ticket 1): Your line on the Seniority List excerpt plus the Standing figures. Under it, one line: "Not on the list yet? New Hire Mode estimates your starting position."
3. **When you can hold each Qualification** (ticket 2): Holdability table, Captain seat selected by default, seat switch kept.
4. **Which retirements move you** (ticket 2): Retirement Wave with the percentile overlay and the "N retirements senior to you in the next N years" slider.
5. **What changed since the last list** (ticket 3): the real diff between the two demo lists.
6. **Privacy** (ticket 3): one three-item strip (Use your airline's data / Local data / No account).
7. **Supported lists** (ticket 3): one compact row: Delta, jetBlue, Generic CSV/XLSX. Links: "Required format" → `/how-it-works#data-compatibility`; "Request an Import Plugin" (GitHub issue link and mailto, as today).
8. **Closing call to action**: View Demo and Open Dashboard.

Removed from the landing page: Position by qualification scale, Age Distribution, the six feature cards, the New Hire mock card, the Required Data Format collapsible, the duplicate trust-signal rows. Alternate section backgrounds so no two neighbours share one.

Delete once unused: `app/composables/useLandingDemo.ts` and its test, `app/components/demo/TrajectoryDemo.vue`, `app/components/demo/ComparisonDemo.vue`, `app/utils/diff-fixture.ts` (check every import first).

## Tickets

### Ticket 0: Injected seniority core and landing showcase

As described under Architecture. Tests: `useSeniorityCore` returns the injected core inside a provider and the store core outside; `useScenario` state does not leak between a provider with `stateKey` and the dashboard; `useLandingShowcase` becomes ready with a Standing for the demo pilot and non-empty `diffRows`, and writes nothing to Dexie.

### Ticket 1: Hero trajectory and Where you stand today

- `LandingTrajectory.vue`: `DashboardTrajectoryChart` fed by `useNextProjections().projectionChart`, company-wide, default Growth Assumptions; title "Your Seniority Percentile over time"; the percentile scale label behind an info popover.
- `LandingStanding.vue`: the excerpt table (`useListExcerpt`) with the highlighted line and the Standing figures (`useStanding`). Figure note links that point into the dashboard become plain text or emit `open-demo`.

### Ticket 2: Holdability and Retirement Wave

- `LandingHoldability.vue`: `useHoldability` rows for the selected seat, defaulting to Captain (`CA`) when present. Columns as on Current › Holdability. Row detail expansion is not required.
- `LandingRetirementWave.vue`: `useNextProjections().retirementWave` and `wavePercentileSeries` into `AnalyticsRetirementWaveChart`, with the "Retirements within" slider (`useSettledModel`) and its label.

### Ticket 3: Comparison, privacy and supported lists

- Bring `ComparisonDiffTab.vue` to the design system (this also changes List › Compare): stock `UTable` paged with `useTableFeatures` + `ui/TablePagination`, sentence-case headers, Qualification shown Base, Seat, Fleet order, `AppSwitch` for "Show Seniority Number changes", change kinds as stock neutral/outline `UBadge`s instead of red/amber row fills, semantic tokens only. Keep its props and existing test intent; update the tests.
- `LandingComparison.vue`: `ComparisonDiffTab` fed by `useLandingShowcase().diffRows`.
- `LandingPrivacy.vue` and `LandingSupportedLists.vue` as described under Page layout.

### Ticket 4: Page assembly (integration)

Rewrite `index.vue` to the layout above, delete the unused files, rewrite `index.test.ts` to the new page, and verify.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` pass.
- The layering grep in `app/AGENTS.md` prints nothing.
- Screenshots of the built site in dark and light mode at 1280px and at 500px: landing page, and List › Compare in demo mode.
- Landing figures match the demo dashboard for the same pilot on the same day (Rank today, Seniority Percentile, N retirements senior in 5 years).
- Visiting `/` leaves IndexedDB without seniority lists.
