# CLAUDE.md — Pilot Seniority Tracker

## Project Overview

A web app for airline pilots to track and project their seniority standing over time. Users can see their position on the master seniority list, project trajectory by base and seat, and analyze retirement pressure / upcoming vacancies.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 4 |
| UI | NuxtUI (module) |
| State | Pinia
| Backend / DB | Supabase |
| Auth | `@nuxtjs/supabase` module (SSR cookies / PKCE) |
| Deployment | NuxtHub (Cloudflare Workers) |
| Language | TypeScript throughout |

---

## Key Architecture Decisions

- **Single Supabase project** for dev and prod initially; split before going live with real users
- **No Docker** — Supabase CLI handles local DB via its own Docker internals; NuxtHub handles runtime
- **SSR auth via cookies** — `@nuxtjs/supabase` with `useSsrCookies: true` (default); PKCE flow required
- **RLS everywhere** — all tables have Row Level Security; use a `get_my_role()` security definer helper for role checks

---

## Auth

- Use `useSupabaseUser()` and `useSupabaseSession()` on the client
- Use `serverSupabaseUser()` in Nitro API routes to verify auth (returns JWT claims — see below)
- Use `serverSupabaseClient()` for user-scoped DB operations in server routes (carries user session, respects RLS)
- Use `serverSupabaseServiceRole()` only when bypassing RLS is required (e.g., admin operations, cross-user queries)
- Required pages: `/auth/login`, `/auth/signup`, `/auth/confirm` (PKCE callback), `/auth/setup-profile`, `/auth/reset-password`, `/auth/update-password`, `/auth/resend-email`
- Roles: `user`, `moderator`, `admin` stored in `profiles.role` enum
- Never trust client-side role assignment — restrict `profiles` update via RLS policy

### JWT Claims (not User object)

Both `useSupabaseUser()` (client) and `serverSupabaseUser()` (server) return **JWT claims**, NOT the full Supabase `User` object:

- **Use `user.sub`** for the user UUID (NOT `user.id` — it does not exist)
- **Use `user.user_metadata?.email_verified`** for email verification (NOT `user.email_confirmed_at`)
- Available claims: `sub`, `email`, `role`, `aal`, `amr`, `app_metadata`, `user_metadata`
- NOT available as claims: `id`, `email_confirmed_at`, `created_at`, `phone_confirmed_at`
- If you need the full User object, call `supabase.auth.getUser()` explicitly

---

## Database Schema (planned)

```sql
-- airlines (reference table — loaded from CSV via npm run db:seed-airlines)
icao text primary key
iata text
name text not null
alias text  -- alternate/common name

-- profiles (extends auth.users)
id uuid references auth.users primary key
role user_role default 'user'
icao_code text references airlines(icao) on delete set null  -- nullable; required to access app
employee_number text
hire_date date
created_at timestamptz

-- seniority_lists
id uuid primary key
airline text
effective_date date
uploaded_by uuid references profiles
status text -- 'active' | 'archived'

-- seniority_entries
id uuid primary key
list_id uuid references seniority_lists
seniority_number integer
employee_number text
name text
hire_date date
base text
seat text -- 'CA' | 'FO'
fleet text
retire_date date  -- age-65 retirement date (no dob stored)
```

---

## Core Features

- [ ] Auth (sign up, login, confirm, profile setup)
- [ ] Upload / import seniority list (CSV)
- [ ] Master seniority list view with user's position highlighted
- [ ] Seniority trajectory over time (chart by year)
- [ ] Base/seat breakdown — seniority rank per base
- [ ] Retirement projections — age 65 retirements by year
- [ ] Upcoming retirements table (pilots ahead of user)
- [ ] Admin / moderator list management

---

## Project Structure

```
/
├── app/
│   ├── pages/
│   │   ├── index.vue           # dashboard
│   │   ├── login.vue
│   │   ├── confirm.vue         # PKCE callback — required
│   │   ├── seniority/
│   │   │   ├── index.vue       # master list
│   │   │   └── [id].vue        # individual list view
│   │   └── admin/
│   ├── components/
│   ├── composables/
│   └── middleware/
│       └── auth.ts             # redirect unauthenticated users
├── server/
│   └── api/                    # Nitro routes using serverSupabaseClient
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── nuxt.config.ts
```

---

## Environment Variables

```bash
SUPABASE_URL=
SUPABASE_KEY=           # anon/public key
SUPABASE_SERVICE_KEY=   # server-side only, never expose to client
```

---

## Commands

```bash
npm install             # install dependencies
npm run dev             # Nuxt dev server
npm run build           # production build
npm test                # run test suite (Vitest)
npm run test:watch      # run tests in watch mode
npm run typecheck       # run vue-tsc type check
npm run db:types        # regenerate types/database.ts from Supabase schema
npm run db:seed-airlines  # load airlines CSV into local Supabase

npm run db:start        # spins up local Supabase (requires Docker)
npm run db:reset        # apply migrations + seed.sql
supabase db push        # push local migrations to remote
```

---

## Testing

**All new features and bug fixes require tests.** `npm test` must pass before any PR is merged.

**Stack:** Vitest + `@nuxt/test-utils` + `@vue/test-utils` + `happy-dom`

**Config:** `vitest.config.ts` — default environment is `nuxt`. Add `// @vitest-environment node` at the top of pure unit test files (e.g., schema tests) to skip Nuxt startup overhead.

**Patterns:**
- **Schema tests** (`shared/schemas/*.test.ts`): pure Zod validation, `@vitest-environment node`
- **Middleware tests** (`app/middleware/*.test.ts`): use `mockNuxtImport` for Nuxt composables, `vi.mock` for explicit store imports
- **Component tests** (`app/pages/**/*.test.ts`): use `@nuxt/test-utils/runtime` mounting helpers

**Rules:**
- Test file lives next to the file it tests (co-location)
- Use `vi.hoisted` for mock variables that `vi.mock` factories reference — `vi.mock` is hoisted but top-level variables are not
- Never use `ref` (or other auto-imports) inside `vi.hoisted` — import explicitly from `vue` or use plain mutable objects instead
- `navigateTo` is a Nuxt auto-import — mock it with `mockNuxtImport`, not `vi.mock`

---

## Conventions

- All DB queries go through Supabase client — no raw fetch to PostgREST
- Server-only secrets (service key) only used in `server/` routes
- Composables for shared data-fetching logic (e.g., `useSeniorityList()`)
- NuxtUI components used for all UI primitives — no custom component duplicates what NuxtUI provides
- **Theming**: always use Nuxt UI semantic tokens (`--ui-bg`, `--ui-text-muted`, `--ui-border`, etc.) — only use raw Tailwind utilities as an escape hatch when Nuxt UI semantics can't achieve what's needed. When referencing colors inside `--ui-*` overrides, use Tailwind's `--color-*` variables (e.g., `var(--color-slate-200)`), NOT `--ui-color-*`
- TypeScript strict mode; define DB types from Supabase generated types (`supabase gen types typescript`)

### Validation & DTOs

Use **Zod** at every boundary between the frontend and backend. Define schemas in `shared/schemas/` so they can be imported by both Nitro routes and Vue pages/composables.

**Pattern:**
- Define a Zod schema (e.g., `CreateSeniorityListSchema`)
- Infer the TypeScript type from it (`z.infer<typeof CreateSeniorityListSchema>`)
- Validate incoming request bodies in Nitro routes with `safeParse` — return 422 on failure
- Use the same schema for form validation on the client (e.g., with `vee-validate` + Zod or manual `safeParse`)
- Never trust raw request data — always parse through the schema before use

```
shared/
└── schemas/
    ├── seniority-list.ts   # CreateSeniorityListSchema, SeniorityEntrySchema, etc.
    └── profile.ts          # UpdateProfileSchema, etc.
```

---

## Git Workflow

- **Strategy**: GitFlow — see [WORKFLOW.md](WORKFLOW.md) for full reference
- **Branches**: `main` (production), `develop` (integration), `feature/*`, `release/vX.Y.Z`, `hotfix/*`
- **Never** commit directly to `main` or `develop`
- **Branch from**: `develop` for features; `main` for hotfixes
- **Merge via**: squash merge only on GitHub; PR title becomes the squash commit message
- **Releases**: semantic-release runs automatically on push to `main`

### Commit Message Format — Conventional Commits

```
type(scope): description
```

Valid types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`

Breaking changes: use `feat!:` or add `BREAKING CHANGE:` in the footer.

### Claude Slash Commands

| Command | Purpose |
|---|---|
| `/feature` | Create a feature branch from develop |
| `/pr` | Draft and open a PR for the current branch |
| `/hotfix` | Create a hotfix branch from main |
| `/release` | Prepare a release branch from develop |

---

## Open Questions / Decisions Pending

- [ ] How are seniority lists sourced? Manual CSV upload by admin, or user-submitted?
- [ ] Is the app single-airline or multi-airline?
- [ ] Does the app need public/unauthenticated views?
- [ ] Paid tiers / access gating?
