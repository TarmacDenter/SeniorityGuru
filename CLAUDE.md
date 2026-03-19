# CLAUDE.md — Pilot Seniority Tracker

## Project Overview

A web app for airline pilots to track and project their seniority standing over time.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 4 |
| UI | NuxtUI (module) |
| State | Pinia |
| Backend / DB | Supabase |
| Auth | `@nuxtjs/supabase` module (SSR cookies / PKCE) |
| Deployment | Vercel |
| Language | TypeScript throughout |

---

## Environment

- Always use `node`/`npm` as the runtime, NOT `bun` or other alternatives

---

## Key Architecture Decisions

- **Two Supabase projects**: `dev` (ref `nrvrybznzekwseprilqt`) for local/preview, `prod` for production (wired to `main` branch via Vercel + GitHub Actions)
- **No Docker** — Supabase CLI handles local DB via its own Docker internals; Vercel handles runtime
- **SSR auth via cookies** — `@nuxtjs/supabase` with `useSsrCookies: true` (default); PKCE flow required
- **RLS everywhere** — all tables have Row Level Security; use a `get_my_role()` security definer helper for role checks
- **Greenfield — no production users** — the app has not been released publicly. There are no existing users, no live data, and no backwards-compatibility obligations. DB schema changes, Zod schema changes, and TypeScript type changes carry zero migration risk. Propose and implement schema improvements freely.

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

### SSR/CSR Awareness — CRITICAL

- **Always consider SSR vs CSR rendering mode** when writing middleware, plugins, composables, or any code that runs on page load. This project uses `ssr: false` for some routes (`/seniority/**`) and SSR for others
- **`routeRules: { ssr: false }` changes timing of everything**: plugins, middleware, composable hydration
- **`useSupabaseUser()`** is populated by a `page:start` hook on the client, NOT during plugin setup. On CSR-only routes the user ref is `null` when middleware runs — the auth middleware must call `client.auth.getClaims()` as a fallback
- **Always test both SSR and CSR routes** when changing auth, middleware, or navigation logic

---

## Nuxt 4 Conventions

- **Always use Nuxt semantics over raw Vue Router** — use `navigateTo()` instead of `router.push()`, `useRoute()` / `useRouter()` as auto-imports, `definePageMeta` for route meta. Never import from `vue-router` directly
- `shared/` is for code shared between `app/` and `server/` — use `#shared/*` alias
- Generated DB types belong in `shared/types/database.ts`
- `~/` maps to `app/`; `#shared/` for cross-layer imports

---

## Nuxt UI / Theming

- Use Nuxt UI's `UTheme` and `app.config.ts` for theming. Consult the Nuxt UI MCP for component slot APIs before using them
- **Primary color theming uses THREE separate systems** — all must be set to keep them in sync. See `memory/nuxt-ui-theming.md` for the full pattern:
  1. `app.config.ts` `ui.colors.primary: 'sky'` — drives Tailwind utility class generation (`bg-primary`, etc.)
  2. `--ui-primary` in `main.css` — drives `text-primary`, `border-primary` semantic tokens
  3. `--ui-color-primary-*` (all 11 shades) in `main.css` — drives opacity variants (`bg-primary/10`), palette display, and component internals. **`app.config.ts` cannot update these** — must be set explicitly in `main.css` section 3
- **Changing primary color**: update all three locations. `main.css` changes hot-reload instantly; `app.config.ts` requires `rm -rf .nuxt && npm run dev`
- `/dev/theme` — design token playground at `localhost:3000/dev/theme` (dev only)
- When working with `UTable`, the `ui.tr` prop only accepts static class strings, not functions
- **Always use `v-model:` for stateful props** on Nuxt UI components (e.g., `v-model:pagination`, `v-model:sorting`). Using `:prop` (one-way binding) means the UI won't update when you mutate the ref
- **UTable pagination**: use `useTemplateRef('table')` and control via `table.tableApi.setPageIndex()` — do NOT mutate the `v-model:pagination` ref directly
- **UDashboardPanel**: the `#header` slot only renders when content uses the `#body` named slot — putting content in the default slot skips the header. Always use `<template #header>` + `<template #body>` together

---

## Database / Supabase

- Use Supabase JS client with Zod DTOs for data access — do NOT use Drizzle ORM
- RLS policies must avoid self-referencing recursion
- Always use `user.sub` (not `user.id`) for Supabase auth user identification
- Always target local Supabase instance for devment and seeding, not remote DB
- Schema: `airlines`, `profiles`, `seniority_lists`, `seniority_entries` — see `supabase/migrations/` for full definitions
- **Supabase JS returns max 1000 rows by default** — always use `fetchAllRows()` (from `app/composables/useFetchAllRows.ts`) for any query that could exceed 1000 rows. Never use raw `.select('*')` without `.range()` or `fetchAllRows` for large tables like `seniority_entries`

---

## Environment Variables

```bash
SUPABASE_URL=
SUPABASE_KEY=           # anon/public key
SUPABASE_SECRET_KEY=    # server-side only, never expose to client
```

---

## Commands

```bash
npm install             # install dependencies
npm run dev             # Nuxt dev server
npm run build           # production build
npm test                # run test suite (Vitest)
npm run test:watch      # run tests in watch mode
npm run test:e2e        # run Playwright e2e tests
npm run typecheck       # run vue-tsc type check
npm run db:types        # regenerate types/database.ts from Supabase schema
npm run db:seed-airlines  # load airlines CSV into local Supabase
npm run db:start        # spins up local Supabase (requires Docker)
npm run db:reset        # apply migrations + seed.sql
supabase db push        # push local migrations to remote
```

---

## Testing

**All new features and bug fixes require tests.** Before finishing any feature or declaring work done, all three gates must pass:

```bash
npm run lint       # zero errors (warnings OK)
npm run typecheck  # zero errors
npm test           # all tests pass
```

Run all three. Do not claim completion without fresh output from each.

**Stack:** Vitest + `@nuxt/test-utils` + `@vue/test-utils` + `happy-dom`

**Config:** `vitest.config.ts` — default environment is `nuxt`. Add `// @vitest-environment node` at the top of pure unit test files (e.g., schema tests) to skip Nuxt startup overhead.

**Patterns:**
- **Schema tests** (`shared/schemas/*.test.ts`): pure Zod validation, `@vitest-environment node`
- **Middleware tests** (`app/middleware/*.test.ts`): use `mockNuxtImport` for Nuxt composables, `vi.mock` for explicit store imports
- **Plugin tests** (`app/plugins/__tests__/*.test.ts`): Nuxt only scans top-level files in `app/plugins/` — test files must live in `__tests__/` to avoid being picked up as plugins
- **Component tests** (`app/pages/**/*.test.ts`): use `@nuxt/test-utils/runtime` mounting helpers

**Rules:**
- Test file lives next to the file it tests (co-location)
- Use `vi.hoisted` for mock variables that `vi.mock` factories reference — never use auto-imports (like `ref`) inside `vi.hoisted`
- `navigateTo` is a Nuxt auto-import — mock it with `mockNuxtImport`, not `vi.mock`
- Pinia stores are NOT Nuxt auto-imports — must be explicitly imported in middleware

**E2E:** Playwright (`e2e/` directory). Auth fixture logs in via the real login form. Requires local Supabase running + seeded.

---

## Conventions

- All DB queries go through Supabase client — no raw fetch to PostgREST
- Server-only secrets (service key) only used in `server/` routes
- Composables for shared data-fetching logic (e.g., `useSeniorityList()`)
- NuxtUI components used for all UI primitives — no custom component duplicates what NuxtUI provides
- **Theming**: always use Nuxt UI semantic tokens (`--ui-bg`, `--ui-text-muted`, `--ui-border`, etc.) — use raw Tailwind utilities only as escape hatch. When referencing colors inside `--ui-*` overrides, use Tailwind's `--color-*` variables, NOT `--ui-color-*`
- TypeScript strict mode; define DB types from Supabase generated types

### Validation & DTOs

Use **Zod** at every boundary between the frontend and backend. Define schemas in `shared/schemas/` so they can be imported by both Nitro routes and Vue pages/composables.

- Define a Zod schema → infer TypeScript type → validate with `safeParse` (return 422 on failure)
- Use the same schema for client form validation
- Never trust raw request data — always parse through the schema before use

---

## Git Workflow

- **Strategy**: Linear dev with rebase — see [WORKFLOW.md](WORKFLOW.md) for full reference
- **Branches**: `main` (production, protected), `dev` (integration, unprotected), `feature/*`, `hotfix/*`
- **Never** commit directly to `main`
- **Feature integration**: rebase onto `dev`, fast-forward merge (push directly to `dev`)
- **Releases**: squash merge `dev` → `main` via PR; semantic-release runs automatically
- **Hotfixes**: squash merge to `main` via PR, then cherry-pick to `dev`
- **History revision**: `dev` is unprotected — rebase and force-push freely to keep history clean
- **Commit format**: Conventional Commits (`type(scope): description`) — enforced via husky + commitlint
- **Quality gates**: pre-push hook runs typecheck + tests; CI runs both on push to `dev` and PRs to `main`

### Claude Slash Commands

| Command | Purpose |
|---|---|
| `/feature` | Create a feature branch from dev |
| `/pr` | Draft and open a PR for the current branch |
| `/hotfix` | Create a hotfix branch from main |
| `/ship` | Promote dev → main via squash-merge PR |
