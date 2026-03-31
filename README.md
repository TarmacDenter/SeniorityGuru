# SeniorityGuru

A local-first progressive web app for airline pilots to track seniority standing, project career trajectory, and understand retirement-driven rank movement. No accounts, no server, no data ever leaves the device.

Live at [seniorityguru.com](https://seniorityguru.com) · Built with Nuxt 4 + Dexie + Vercel

---

## What it does

Pilots upload their airline's seniority list (CSV or XLSX). The app parses it, maps columns, validates entries, and derives a full analytics picture:

- **Rank & standing** — seniority number, percentile, position by base/seat/fleet
- **Trajectory** — projected rank over time as retirements open slots above you
- **Retirement analysis** — who's aging out, when, and how it affects your rank
- **Demographics** — age distribution, years of service, cohort breakdowns
- **List comparison** — unified diff between two lists: retirements, departures, upgrades, new hires
- **List management** — upload, view, and delete historical lists

---

## Architecture

### Local-first, no SSR

`ssr: false` globally. Pure SPA. No server routes, no Nitro, no auth, no database. All data lives in the user's browser via IndexedDB.

This is an intentional constraint — pilots are cautious about where their employer's data goes. Zero-server means zero data risk.

### Data layer — Dexie (IndexedDB)

`app/utils/db.ts` defines `SeniorityGuruDB` with three tables:

| Table | Contents |
|---|---|
| `seniorityLists` | List metadata: title, effective date, created at |
| `seniorityEntries` | Individual pilot rows linked to a list by `listId` |
| `preferences` | Key-value store for user settings |

Schema changes are handled by Dexie version blocks. Never remove or reorder a version — Dexie needs the full history to upgrade users already on old versions.

### Module boundary

The codebase enforces a strict layering rule: **components never touch `db` directly**.

```
Component → composable/store → db
```

- `useSeniorityStore()` — exposes lists, entries, fetch/delete actions. Calls `db` internally.
- `useUser()` — exposes preferences (employee number, retirement age). Calls `db` internally.
- `useSeniorityUpload()` — orchestrates the upload wizard. Writes to `db` on confirm.

Components call composables and read store refs. If a component imports `db`, something has leaked through the wrong layer.

### Seniority engine

`app/utils/seniority-engine/` is the analytical core — pure functions with no side effects:

- **Snapshot** — builds a point-in-time view of the list with computed rank and percentile
- **Lens** — filters the snapshot by qual (base/seat/fleet) and anchors it to the user
- **Trajectory** — projects rank over time using retirement dates and a growth model

The engine operates on validated `SeniorityEntry` objects. All computation is pure — no store access, no Dexie calls, easily unit-testable.

### Validation boundary

Zod schemas live in `app/utils/schemas/`. Validation happens once at the upload boundary. Downstream code can trust the types.

---

## Stack

| | |
|---|---|
| **Framework** | Nuxt 4 (SPA mode) |
| **UI** | Nuxt UI v3 (Tailwind CSS) |
| **State** | Pinia |
| **Persistence** | Dexie.js (IndexedDB) |
| **Validation** | Zod |
| **Charts** | Chart.js |
| **Testing** | Vitest + @nuxt/test-utils + Playwright |
| **Deploy** | Vercel |

---

## Project layout

```
app/
  pages/
    index.vue               # Landing/marketing page
    dashboard.vue           # Main analytics hub (6 tabs)
    settings.vue            # User preferences
    seniority/
      upload.vue            # 4-step upload wizard
      lists.vue             # Uploaded list management
      compare.vue           # Unified diff between two lists
  layouts/
    default.vue             # Marketing layout (header + footer)
    dashboard.vue           # App layout (sidebar + content)
  composables/
    seniority.ts            # useSeniorityUpload, useSeniorityCompare, useStanding
    user.ts                 # useUser (preferences boundary)
    nav.ts                  # useSeniorityNav (sidebar navigation items)
  stores/
    seniority.ts            # Lists + entries state
    user.ts                 # Preferences state
  components/
    dashboard/              # Tab components, cards, charts
    analytics/              # Chart.js wrappers
    demo/                   # Interactive landing page demos
  utils/
    db.ts                   # Dexie database + schema
    db-adapters.ts          # Raw DB rows → domain types
    schemas/                # Zod entry + preference schemas
    seniority-engine/       # Snapshot, lens, trajectory (pure functions)
    column-definitions.ts   # UTable column configs for compare views
e2e/                        # Playwright end-to-end specs
```

---

## Setup

```bash
pnpm install
pnpm dev    # http://localhost:3000
```

No environment variables required for local development.

---

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm test` | Vitest (unit + component) |
| `pnpm typecheck` | vue-tsc |
| `pnpm lint` | ESLint |
| `pnpm build` | Production build |
| `pnpm test:e2e` | Playwright (requires dev server running) |

---

## Testing

Tests live next to the files they test (co-location). Three environments:

- `@vitest-environment node` — schema and engine tests. Fast, no Nuxt startup. Use for pure functions and Zod schemas.
- `@vitest-environment node` with `fake-indexeddb/auto` — Dexie unit tests. Tests the data layer in isolation.
- Default (`nuxt` environment) — composable and component tests. Use `mountSuspended` for components, `mockNuxtImport` for Nuxt auto-imports, `vi.mock('~/utils/db')` to avoid IndexedDB in happy-dom.

All features and bug fixes require tests. Before merging:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

---

## Git workflow

Linear dev with rebase. Conventional Commits enforced by commitlint + husky.

| Branch | Purpose |
|---|---|
| `main` | Production. Protected. Auto-tagged by semantic-release. |
| `dev` | Integration. Unprotected — push directly, force-push for history revision. |
| `feature/*` | Branch from `dev`, rebase + fast-forward merge back. |
| `hotfix/*` | Branch from `main`, cherry-pick to `dev` after. |

Pre-push hook runs typecheck + tests. CI runs both on push to `dev` and PRs to `main`. After a squash merge to `main`, `sync-dev.yml` automatically rebases `dev` onto `main` — no manual realignment needed.

---

## License

GPL-3.0 — see [LICENSE](LICENSE).
