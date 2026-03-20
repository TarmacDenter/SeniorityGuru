# Seniority Guru

Track your seniority number, project where it's headed, and stop guessing when you'll hold a line.

Upload your airline's seniority list (CSV or XLSX), and the app parses it, maps columns, and gives you:

- **Your rank** across the entire list and within each base/seat/fleet
- **Seniority trajectory** — projected rank over time as retirements open slots
- **Retirement projections** — who's aging out and when, charted by year
- **Base/seat breakdown** — how you stack up in each domicile
- **Comparison tools** — side-by-side diff across two lists with categorized changes
- **List management** — view, edit, and delete your uploaded lists

Data stays isolated per user. You upload your own lists and only see your own data. No shared pool (yet).

## Shipped

- Invite-only auth with PKCE confirm, profile setup, and password reset
- CSV/XLSX upload with column mapping and validation
- Seniority dashboard with rank, demographics, position, retirements, and projections
- List comparison with diff categories and upgrade tracking
- List management (view, edit, delete)
- Settings (profile, preferences, password)
- Admin panel (users, roles, invites, password reset)
- Pagination, search, and sorting across all tables

## Roadmap

- Historical trend tracking (your actual rank across multiple lists over time)
- Data export (CSV/PDF)
- Notifications (new lists, retirement milestones)
- Saved scenarios / bookmarks
- Advanced analytics (cohort analysis, attrition forecasting, cross-list trend tracking)

## Stack

Nuxt 4 · Nuxt UI · Pinia · Supabase (Postgres + Auth) · Vercel · Zod · Chart.js · Vitest + Playwright

## Setup

```bash
npm install
cp .env.example .env

# Start local Supabase (needs Docker), copy printed keys into .env
npm run db:start
npm run db:reset
npm run db:seed-airlines    # airline reference data
npm run db:seed-dev          # test users + seniority data

npm run dev                  # http://localhost:3000
```

### Environment

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<anon-key>
SUPABASE_SECRET_KEY=<service-role-key>   # server-only
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright (needs local Supabase running + seeded) |
| `npm run typecheck` | `vue-tsc` |
| `npm run build` | Production build |
| `npm run db:reset` | Re-apply migrations + seed |
| `npm run db:types` | Regenerate `shared/types/database.ts` from schema |

## Project Layout

```
app/
  pages/              # auth/, seniority/, index.vue, settings.vue, welcome.vue
  composables/        # useSupabase, useDashboardStats, useSeniorityCompare, etc.
  stores/             # Pinia — user.ts, seniority.ts
  middleware/          # auth.ts (route guard, SSR/CSR aware), admin.ts
  components/         # Dashboard cards, upload flow, navbar, comparison UI
server/api/           # Nitro routes — seniority CRUD, admin endpoints
shared/
  schemas/            # Zod schemas shared between client + server
  types/database.ts   # Generated Supabase types
  utils/logger.ts     # Structured logging utility
supabase/
  migrations/         # SQL migrations (schema source of truth)
  scripts/            # Seed scripts
e2e/                  # Playwright specs
```

## Architecture Notes

**Rendering:** Auth pages are SSR. Dashboard and seniority pages are CSR-only (`ssr: false` in route rules). The auth middleware accounts for this — `useSupabaseUser()` is null when middleware runs on CSR routes, so it falls back to `getClaims()`.

**Auth:** Supabase PKCE flow with SSR cookies. Invite-only signup. The user object from `useSupabaseUser()` / `serverSupabaseUser()` is JWT claims, not a full User — use `user.sub` for the UUID, `user.user_metadata?.email_verified` for verification status.

**Database:** Four tables — `airlines`, `profiles`, `seniority_lists`, `seniority_entries`. RLS on everything. Data isolation is by `uploaded_by`. A `get_my_role()` security definer prevents RLS recursion on profile lookups.

**Validation:** Zod schemas in `shared/schemas/` are the single source of truth for both client form validation and server-side `safeParse`. Every API route validates before processing.

**Testing:** Co-located test files. Schema tests use `// @vitest-environment node` to skip Nuxt startup. All features and fixes require tests — `npm test` must pass before merge.

## Git Workflow

Linear dev with rebase. Conventional Commits enforced by commitlint.

- `main` — production, protected, auto-tagged by semantic-release
- `dev` — integration, unprotected (push directly, force-push for history revision)
- `feature/*` — branch from `dev`, rebase + fast-forward merge back
- `hotfix/*` — branch from `main` for emergencies, cherry-pick to `dev` after

Quality gates: pre-push hook runs typecheck + tests. CI runs both on push to `dev` and PRs to `main`.

## License

GPL-3.0 — see [LICENSE](LICENSE).
