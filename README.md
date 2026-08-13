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

## Stack

| | |
|---|---|
| **Framework** | Nuxt 4 (SPA mode) |
| **UI** | Nuxt UI v4 (Tailwind CSS) |
| **State** | Pinia |
| **Persistence** | Dexie.js (IndexedDB) |
| **Validation** | Zod |
| **Charts** | Chart.js |
| **Testing** | Vitest + @nuxt/test-utils + Playwright |
| **Deploy** | Vercel |

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

The project uses trunk-based development. Create short-lived `feature/*` or `hotfix/*` branches from `main`, then squash merge a reviewed pull request back into `main`.

See [WORKFLOW.md](WORKFLOW.md) for branch, pull-request, and quality-gate requirements.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to add or improve an airline parser.

---

## License

GPL-3.0 — see [LICENSE](LICENSE).
