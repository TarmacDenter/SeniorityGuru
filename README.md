# Seniority Guru

A web application for airline pilots to track and project their seniority standing over time. Pilots upload seniority lists published by their airline, and the app calculates trends, projections, and relative standing across the fleet.

## Why This Exists

Airline pilot seniority determines everything — schedules, aircraft assignments, base locations, and quality of life. Lists are published regularly but tracking changes over time is manual and tedious. Seniority Guru automates that: upload a list, and instantly see where you stand, how you're trending, and where you're headed.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | [Nuxt 4](https://nuxt.com/) | SSR where needed, SPA where not — with file-based routing and auto-imports |
| **UI** | [Nuxt UI](https://ui.nuxt.com/) + [Tailwind CSS 4](https://tailwindcss.com/) | Consistent component library with built-in dark mode and theming |
| **State** | [Pinia](https://pinia.vuejs.org/) | Lightweight store for client-side state management |
| **Database** | [Supabase](https://supabase.com/) (Postgres) | Managed Postgres with auth, real-time, and Row Level Security |
| **Auth** | [`@nuxtjs/supabase`](https://supabase.nuxtjs.org/) | SSR-compatible auth via cookies with PKCE flow |
| **Deployment** | [NuxtHub](https://hub.nuxt.com/) (Cloudflare Workers) | Edge deployment — compute only, all data lives in Supabase |
| **Validation** | [Zod](https://zod.dev/) | Shared schemas between client and server for type-safe validation |
| **Charts** | [Chart.js](https://www.chartjs.org/) via [vue-chartjs](https://vue-chartjs.org/) | Seniority trend visualizations |
| **Testing** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) | Unit/integration tests and end-to-end tests |

## Project Structure

```
SeniorityGuru/
├── app/                    # Nuxt application layer
│   ├── pages/
│   │   ├── auth/           # Login, signup, password reset, email confirm
│   │   ├── seniority/      # List browser and upload flow
│   │   ├── index.vue       # Dashboard
│   │   └── settings.vue    # User settings
│   ├── composables/        # Shared logic (data fetching, chart theming, etc.)
│   ├── middleware/          # Route guards (auth protection)
│   ├── components/         # Vue components
│   └── assets/css/         # Global styles
├── server/
│   └── api/                # Nitro API routes (server-side logic)
├── shared/                 # Code shared between app/ and server/
│   ├── schemas/            # Zod validation schemas (used by both layers)
│   └── types/              # Generated database types
├── supabase/
│   ├── migrations/         # SQL migrations (source of truth for schema)
│   ├── scripts/            # Seed scripts (airlines, users, seniority data)
│   └── seed.sql            # Base seed data
├── e2e/                    # Playwright end-to-end tests
├── nuxt.config.ts          # Nuxt configuration
└── vitest.config.ts        # Test configuration
```

**Import aliases:**
- `~/` maps to `app/`
- `#shared/` maps to `shared/` (use for cross-layer imports)

## Getting Started

### Prerequisites

- **Node.js 22+** and **npm** (do not use bun/yarn/pnpm)
- **Docker** (required by Supabase CLI for the local database)
- **Supabase CLI** (`npm install` handles this as a dev dependency)

### Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd SeniorityGuru
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — local values are printed by `supabase start` (step 3)

# 3. Start local Supabase (Postgres, Auth, Storage, etc.)
npm run db:start
# Copy the anon key, service_role key, and API URL into your .env

# 4. Apply migrations and seed data
npm run db:reset

# 5. (Optional) Load airline reference data and dev fixtures
npm run db:seed-airlines
npm run db:seed-dev

# 6. Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

```bash
# .env
SUPABASE_URL=http://127.0.0.1:54321      # Local Supabase API
SUPABASE_KEY=<anon-key>                    # Public key (safe for client)
SUPABASE_SECRET_KEY=<service-role-key>     # Server-only — never expose to client
```

## Development

### Key Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Nuxt dev server with HMR |
| `npm test` | Run all unit/integration tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run typecheck` | Type-check with `vue-tsc` |
| `npm run build` | Production build |
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset DB: re-apply all migrations + seed |
| `npm run db:types` | Regenerate TypeScript types from DB schema |

### SSR vs Client-Side Rendering

Not all pages render the same way. The dashboard and seniority pages are **client-only** (`ssr: false` in route rules) because they show user-specific data that isn't indexable. Auth pages and landing pages use SSR.

This matters when writing middleware, composables, or plugins — on CSR routes, `useSupabaseUser()` is `null` when middleware first runs. The auth middleware handles this with a `getClaims()` fallback. Always test your changes against both SSR and CSR routes.

### Database

The schema has four core tables:

- **`airlines`** — reference data for airline names/codes
- **`profiles`** — user profiles with role (`user`, `moderator`, `admin`)
- **`seniority_lists`** — uploaded list metadata (airline, published date, scope)
- **`seniority_entries`** — individual rows within a seniority list

All tables use **Row Level Security (RLS)**. Migrations in `supabase/migrations/` are the source of truth for the schema. After changing a migration, run `npm run db:reset` to re-apply and `npm run db:types` to regenerate TypeScript types.

### Auth Notes

- Client: use `useSupabaseUser()` and `useSupabaseSession()`
- Server routes: use `serverSupabaseUser()` to verify auth, `serverSupabaseClient()` for user-scoped queries
- The user object from these helpers returns **JWT claims**, not a full User object — use `user.sub` for the UUID (not `user.id`)
- `serverSupabaseServiceRole()` bypasses RLS — use only in server routes when necessary

### Validation

Zod schemas live in `shared/schemas/` and are shared between client forms and server API routes. Every API route validates input with `safeParse` before processing. When adding a new endpoint or form, define the schema in `shared/schemas/` first.

### Testing

Tests live **next to the code they test** (co-located). All new features and bug fixes require tests — `npm test` must pass before merging.

- **Schema tests** (`shared/schemas/*.test.ts`): pure Zod validation, use `// @vitest-environment node` to skip Nuxt overhead
- **Middleware tests** (`app/middleware/*.test.ts`): use `mockNuxtImport` for Nuxt composables
- **Composable tests** (`app/composables/*.test.ts`): test data-fetching and business logic
- **E2E tests** (`e2e/`): Playwright against a running app with local Supabase seeded

## Git Workflow

This project uses **GitFlow** with [Conventional Commits](https://www.conventionalcommits.org/) enforced by husky + commitlint.

### Branches

```
main ─────────────────────────────────────► production (tagged releases)
  │                        ▲
  └── dev ────────────┤───────────────► integration
        │         ▲       │
        └── feature/* ────┘
```

| Branch | Purpose | Created from | Merges into |
|---|---|---|---|
| `main` | Production releases (auto-tagged by semantic-release) | — | — |
| `dev` | Integration — all feature work lands here | `main` | `main` via release branch |
| `feature/*` | Individual features or fixes | `dev` | `dev` |
| `release/vX.Y.Z` | Release stabilization (bug fixes only) | `dev` | `main` + back-merge to `dev` |
| `hotfix/*` | Emergency production fixes | `main` | `main` + back-merge to `dev` |

### Branch Rules

- **Never commit directly to `main` or `dev`** — always use a PR
- All PRs use **squash merge** — the PR title becomes the commit message
- PR titles must follow Conventional Commits format: `type(scope): description`
- CI (typecheck) must pass before merging

### Commit Message Format

```
type(scope): description

# Examples:
feat(auth): add PKCE login flow
fix(seniority): correct rank calculation for tied hire dates
chore(deps): upgrade nuxt to 4.1.0
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`

Breaking changes: append `!` after the type (e.g., `feat!: rename columns`) or add `BREAKING CHANGE:` in the commit footer.

### Typical Feature Workflow

```bash
# Start from an up-to-date dev branch
git checkout dev && git pull origin dev
git checkout -b feature/my-feature

# Work, commit with conventional messages
git add -A && git commit -m "feat(seniority): add trend chart to dashboard"

# Push and open a PR to dev
git push -u origin feature/my-feature
# Open PR: feature/my-feature → dev
```

### Releases

Releases are cut from `dev` into a `release/vX.Y.Z` branch, stabilized, then squash-merged into `main`. Semantic-release runs automatically on push to `main` — it bumps the version, generates the changelog, and creates a GitHub release with a git tag.

## CI/CD

Two GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`) — runs `npm run typecheck` on pushes to `dev` and PRs to `main`/`dev`
- **Release** (`.github/workflows/release.yml`) — runs `semantic-release` on pushes to `main`

Deployment to Cloudflare Workers is handled by NuxtHub (configured separately).

## License

Private — not open source.
