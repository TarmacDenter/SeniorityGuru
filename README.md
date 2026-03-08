# Seniority Guru

Track your seniority number, project where it's headed, and stop guessing when you'll hold a line.

Upload your airline's seniority list (CSV or XLSX), and the app parses it, maps columns, and gives you:

- **Your rank** across the entire list and within each base/seat/fleet
- **Seniority trajectory** — projected rank over time as retirements open slots
- **Retirement projections** — who's aging out and when, charted by year
- **Base/seat breakdown** — how you stack up in each domicile
- **Comparison tools** — side-by-side stats across lists

Data stays isolated per user. You upload your own lists and only see your own data. No shared pool (yet).

## Roadmap

### Shipped

- Auth flow (signup, PKCE confirm, profile setup with airline/employee number)
- CSV/XLSX upload with interactive column mapping
- Full seniority list viewer with your row highlighted
- Dashboard with trajectory chart, retirement projections, base breakdown, stats grid
- Settings page (profile, preferences, password)

### Next

- **List management** — view, archive, delete your uploaded lists
- **Public landing page** — explain what this is to new visitors
- **Upcoming retirements table** — who above you is retiring in 1-5 years

### Future

- Historical trend tracking (your actual rank across multiple lists over time)
- Data export (CSV/PDF)
- Admin panel and moderator tools (airline rep list approval)
- Notifications (new lists, retirement milestones)
- Saved scenarios / bookmarks
- Advanced analytics (cohort analysis, attrition forecasting)

## Stack

Nuxt 4 · Nuxt UI · Pinia · Supabase (Postgres + Auth) · NuxtHub (Cloudflare Workers) · Zod · Chart.js · Vitest + Playwright

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
  pages/              # auth/, seniority/, index.vue, settings.vue
  composables/        # useSupabase, useDashboardStats, useSeniorityUpload, etc.
  stores/             # Pinia — user.ts, seniority.ts
  middleware/auth.ts  # Route guard (SSR/CSR aware)
  components/         # Dashboard cards, upload flow, navbar
server/api/           # Nitro routes (seniority-lists.post.ts)
shared/
  schemas/            # Zod schemas shared between client + server
  types/database.ts   # Generated Supabase types
supabase/
  migrations/         # SQL migrations (schema source of truth)
  scripts/            # Seed scripts
e2e/                  # Playwright specs
```

## Architecture Notes

**Rendering:** Auth pages are SSR. Dashboard and seniority pages are CSR-only (`ssr: false` in route rules). The auth middleware accounts for this — `useSupabaseUser()` is null when middleware runs on CSR routes, so it falls back to `getClaims()`.

**Auth:** Supabase PKCE flow with SSR cookies. The user object from `useSupabaseUser()` / `serverSupabaseUser()` is JWT claims, not a full User — use `user.sub` for the UUID, `user.user_metadata?.email_verified` for verification status.

**Database:** Four tables — `airlines`, `profiles`, `seniority_lists`, `seniority_entries`. RLS on everything. Data isolation is by `uploaded_by`. A `get_my_role()` security definer prevents RLS recursion on profile lookups.

**Validation:** Zod schemas in `shared/schemas/` are the single source of truth for both client form validation and server-side `safeParse`. Every API route validates before processing.

**Testing:** Co-located test files. Schema tests use `// @vitest-environment node` to skip Nuxt startup. All features and fixes require tests — `npm test` must pass before merge.

## Git Workflow

GitFlow with Conventional Commits enforced by commitlint.

- `main` — production, auto-tagged by semantic-release
- `dev` — integration
- `feature/*` — branch from `dev`, squash-merge back via PR
- `release/vX.Y.Z` — cut from `dev`, squash into `main`
- `hotfix/*` — branch from `main` for emergencies

PR titles follow `type(scope): description`. CI runs typecheck on all PRs.

## License

GPL-3.0 — see [LICENSE](LICENSE).
