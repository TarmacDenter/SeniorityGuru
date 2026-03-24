# Seniority Guru

Track your seniority number, project where it's headed, and stop guessing when you'll hold a line.

Upload your airline's seniority list (CSV or XLSX), and the app parses it, maps columns, and gives you:

- **Your rank** across the entire list and within each base/seat/fleet
- **Seniority trajectory** — projected rank over time as retirements open slots
- **Retirement projections** — who's aging out and when, charted by year
- **Base/seat breakdown** — how you stack up in each domicile
- **Comparison tools** — side-by-side diff across two lists with categorized changes
- **List management** — view, edit, and delete your uploaded lists

All data lives on your device. Nothing is sent to a server.

## Shipped

- CSV/XLSX upload with column mapping and validation
- Seniority dashboard with rank, demographics, position, retirements, and projections
- List comparison with diff categories and upgrade tracking
- List management (view, edit, delete)
- Settings (employee number, retirement age, clear all data)
- PWA — installable, works offline

## Roadmap

- Historical trend tracking (your actual rank across multiple lists over time)
- Data export (CSV/PDF)
- Notifications (retirement milestones)
- Saved scenarios / bookmarks
- Advanced analytics (cohort analysis, attrition forecasting, cross-list trend tracking)

## Stack

Nuxt 4 · Nuxt UI · Pinia · Dexie (IndexedDB) · Vercel · Zod · Chart.js · Vitest

## Setup

```bash
npm install
npm run dev    # http://localhost:3000
```

No environment variables required for local development.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Vitest |
| `npm run typecheck` | `vue-tsc` |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Project Layout

```
app/
  pages/          # seniority/, index.vue, dashboard.vue, settings.vue
  composables/    # useStanding, useSeniorityUpload, useTrajectory, etc.
  stores/         # Pinia — seniority.ts, user.ts
  components/     # Dashboard cards, upload flow, navbar, settings
  utils/
    db.ts         # Dexie database definition (IndexedDB)
    db-adapters.ts
    schemas/      # Zod schemas
    seniority-engine/  # Pure computation — snapshot, lens, trajectory
e2e/              # Playwright specs
```

## Architecture Notes

**Data:** All seniority data is stored in IndexedDB via Dexie.js (`app/utils/db.ts`). No server, no database, no account required. `db.seniorityLists`, `db.seniorityEntries`, and `db.preferences` are the three tables.

**Rendering:** Pure SPA (`ssr: false` globally). No server routes.

**Validation:** Zod schemas in `app/utils/schemas/` validate at the upload boundary. The seniority engine operates on validated `SeniorityEntry` objects.

**Schema migrations:** Handled by Dexie version declarations in `db.ts`. Never remove a version block — Dexie needs the full history to upgrade users on old versions.

**Testing:** Co-located test files. Schema and engine tests use `// @vitest-environment node` to skip Nuxt startup. All features and fixes require tests — `npm test` must pass before merge.

## Git Workflow

Linear dev with rebase. Conventional Commits enforced by commitlint.

- `main` — production, protected, auto-tagged by semantic-release
- `dev` — integration, unprotected (push directly, force-push for history revision)
- `feature/*` — branch from `dev`, rebase + fast-forward merge back
- `hotfix/*` — branch from `main` for emergencies, cherry-pick to `dev` after

Quality gates: pre-push hook runs typecheck + tests. CI runs both on push to `dev` and PRs to `main`.

## License

GPL-3.0 — see [LICENSE](LICENSE).
