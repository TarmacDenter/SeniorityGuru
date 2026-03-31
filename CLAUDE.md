# CLAUDE.md — Pilot Seniority Tracker

A local-first PWA for airline pilots to track and project their seniority standing. Stack: Nuxt 4 + Dexie (IndexedDB) + Vercel. Read `package.json` for commands, `nuxt.config.ts` for configuration.

**Runtime:** Always use `node`/`pnpm`, NOT `bun` or `npm`.

---

## Key Architecture Decisions

- **No server, no auth, no accounts** — pure SPA (`ssr: false` globally). All data lives in the user's browser via IndexedDB. No Nitro routes, no Supabase, no RLS.
- **Dexie.js for persistence** — `app/utils/db.ts` defines `SeniorityGuruDB` with three tables: `seniorityLists`, `seniorityEntries`, `preferences`. The singleton `db` export is the only way to read/write data.
- **Schema migrations via Dexie versions** — add `this.version(N).stores({...}).upgrade(tx => {...})` for each schema change. Never remove or reorder existing version blocks.
- **Deep module composables** — pages and components call composables only; stores are internal infrastructure. Pages and components never import `db` or `use*Store` directly.
- **Stores own all `db` access** — only Pinia stores may import `db` from `~/utils/db`. Composables call store methods, never `db.*` directly. This ensures Dexie writes always update reactive store state, so downstream computeds and UI re-render automatically.
- **No cross-store dependencies** — stores must never import other stores. When an operation spans multiple stores (e.g., clearing all data), use a higher-order composable that coordinates the stores. A store that imports another store is a signal that logic belongs in a composable.
- **No Docker** — there is no local database to run. `pnpm install && pnpm dev` is the full setup.

---

## Data Layer

**Reading data in components and pages:** call composables — never import `use*Store` directly in a `.vue` file.

**Writing data:** composable actions call store methods, which write to Dexie and update reactive state in one place. No layer may call `db.*` except stores.

**Composable boundary (hard rule):** Pages and components call composables only — stores are internal infrastructure. If the UI needs data from a store, the fix is to expose it through an existing composable or create a new one.

- User/preference data → `useUser()` — exposes `employeeNumber`, `retirementAge`, `loadPreferences()`, `savePreference()`, `clearPreferences()`
- Seniority list CRUD → `useSeniorityLists()` — exposes `lists`, `listsLoading`, `listsError`, `entriesLoading`, `listOptions`, `fetchLists()`, `fetchEntries()`, `deleteList()`, `updateList()`, `clearStore()`
- Entries / snapshot / lens → `useSeniorityCore()` — exposes `entries`, `snapshot`, `lens`, `userEntry`, `hasData`, `hasAnchor`, `isNewHireMode`, `newHire`

### Store design patterns

- **Write-through**: store methods that mutate Dexie must also update their own reactive refs (e.g., `addList` writes to Dexie then pushes onto `store.lists`). This is what makes the event system unnecessary — Vue reactivity propagates the change.
- **Return without caching**: when a composable needs transient data (e.g., comparison entries for two lists), the store provides a method that reads from Dexie and returns the result without storing it in reactive state. The composable holds the data in its own local refs.
- **`useUserStore` owns all preferences**: general-purpose key-value persistence via `savePreference(key, value)` / `getPreference(key)`. Feature-specific composables (new-hire config, PWA install state) call the store — they do not read/write `db.preferences` directly.
- **Upload does not auto-select**: `addList` adds the list to the store's `lists` array but does not change `currentListId` or populate `entries`. The dashboard decides what to display based on the user's most recent selection or the most recently effective list.
- **Cross-store coordination**: when an action spans multiple stores, a higher-order composable orchestrates the calls. Stores never import other stores.

### Dexie patterns

```ts
// Read
const lists = await db.seniorityLists.orderBy('effectiveDate').reverse().toArray()

// Write
const listId = await db.seniorityLists.add({ title, effectiveDate, createdAt })
await db.seniorityEntries.bulkAdd(entries)

// Transactional delete
await db.transaction('rw', db.seniorityLists, db.seniorityEntries, async () => {
  await db.seniorityEntries.where('listId').equals(listId).delete()
  await db.seniorityLists.delete(listId)
})

// Preference
await db.preferences.put({ key: 'employeeNumber', value: '12345' })
const pref = await db.preferences.get('employeeNumber')
```

---

## Nuxt 4 Conventions

- **Always use Nuxt semantics over raw Vue Router** — use `navigateTo()` instead of `router.push()`, `useRoute()` / `useRouter()` as auto-imports, `definePageMeta` for route meta. Never import from `vue-router` directly.
- **No SSR** — `ssr: false` globally. No server routes, no SSR-specific guards.
- `~/` maps to `app/`
- `app/utils/` is for shared utilities (schemas, engine, db, adapters)

---

## Nuxt UI / Theming

- Use Nuxt UI's `UTheme` and `app.config.ts` for theming. Consult the Nuxt UI MCP for component slot APIs before using them.
- **Primary color theming uses THREE separate systems** — all must be set to keep them in sync. See `memory/nuxt-ui-theming.md` for the full pattern:
  1. `app.config.ts` `ui.colors.primary: 'sky'` — drives Tailwind utility class generation (`bg-primary`, etc.)
  2. `--ui-primary` in `main.css` — drives `text-primary`, `border-primary` semantic tokens
  3. `--ui-color-primary-*` (all 11 shades) in `main.css` — drives opacity variants (`bg-primary/10`), palette display, and component internals. **`app.config.ts` cannot update these** — must be set explicitly in `main.css` section 3
- **Changing primary color**: update all three locations. `main.css` changes hot-reload instantly; `app.config.ts` requires `rm -rf .nuxt && pnpm dev`
- `/dev/theme` — design token playground at `localhost:3000/dev/theme` (dev only)
- When working with `UTable`, the `ui.tr` prop only accepts static class strings, not functions
- **Always use `v-model:` for stateful props** on Nuxt UI components (e.g., `v-model:pagination`, `v-model:sorting`). Using `:prop` (one-way binding) means the UI won't update when you mutate the ref
- **UTable pagination**: use `useTemplateRef('table')` and control via `table.tableApi.setPageIndex()` — do NOT mutate the `v-model:pagination` ref directly
- **UDashboardPanel**: the `#header` slot only renders when content uses the `#body` named slot — putting content in the default slot skips the header. Always use `<template #header>` + `<template #body>` together

---

## Testing

**Approach: TDD, vertical slices.** Write one failing test, write minimal code to pass it, repeat. Never write a batch of tests before writing any implementation — that produces tests coupled to imagined behavior, not real behavior. One test → one implementation → next test.

**Test behavior through public interfaces**, not implementation. A composable test drives the composable through its returned API. Tests that break on internal refactors without behavior changing are testing the wrong thing.

**All new features and bug fixes require tests.** Before finishing any feature or declaring work done, all three gates must pass:

```bash
pnpm lint       # zero errors (warnings OK)
pnpm typecheck  # zero errors
pnpm test       # all tests pass
```

Run all three. Do not claim completion without fresh output from each.

**Stack:** Vitest + `@nuxt/test-utils` + `@vue/test-utils` + `happy-dom`

**Config:** `vitest.config.ts` — default environment is `nuxt`. Add `// @vitest-environment node` at the top of pure unit test files (schema tests, db tests) to skip Nuxt startup overhead.

**Patterns:**
- **Schema tests** (`app/utils/schemas/*.test.ts`): pure Zod validation, `@vitest-environment node`
- **DB tests** (`app/utils/db.test.ts`): use `fake-indexeddb/auto`, `@vitest-environment node`
- **Composable tests**: `@vitest-environment node` when no Nuxt auto-imports needed; mock stores with `vi.mock`, Nuxt composables with `mockNuxtImport`; mock `~/utils/db` to avoid IndexedDB conflicts in happy-dom
- **Component tests**: use `mountSuspended` from `@nuxt/test-utils/runtime`; mock `useUser()` as the boundary — do not mock internal collaborators

**Rules:**
- Test file lives next to the file it tests (co-location)
- Use `vi.hoisted` for mock variables that `vi.mock` factories reference — never use auto-imports (like `ref`) inside `vi.hoisted`
- `navigateTo` is a Nuxt auto-import — mock it with `mockNuxtImport`, not `vi.mock`
- Mock `~/utils/db` in store/composable tests — do not use `fake-indexeddb` in the nuxt vitest environment (use it only in `@vitest-environment node` db unit tests)

**E2E:** Playwright (`e2e/` directory). No auth required — just run `pnpm dev` and `pnpm test:e2e`.

---

## Conventions

- Composables for shared data-fetching logic — read `app/composables/` for existing patterns before writing new ones
- NuxtUI components used for all UI primitives — no custom component duplicates what NuxtUI provides
- **Theming**: always use Nuxt UI semantic tokens (`--ui-bg`, `--ui-text-muted`, `--ui-border`, etc.) — use raw Tailwind utilities only as escape hatch. When referencing colors inside `--ui-*` overrides, use Tailwind's `--color-*` variables, NOT `--ui-color-*`
- TypeScript strict mode

### Declarative Components

Components call actions and handle outcomes. They do not orchestrate sequences.

- **Do**: `const { error } = await savePreference('employeeNumber', normalized)`
- **Don't**: read from db → optimistic update → write to db → rollback on error — that logic belongs in the composable or store
- A component that imports `db` or calls `useSeniorityStore` internals directly is a signal that logic has leaked into the wrong layer
- Normalize input before passing to a composable action (e.g., `normalizeEmployeeNumber`), but leave the persistence logic to the composable

### Validation & DTOs

Use **Zod** at the upload boundary. Schemas live in `app/utils/schemas/`.

- Define a Zod schema → infer TypeScript type → validate with `safeParse`
- `SeniorityEntrySchema` is the canonical definition of a valid seniority entry
- `normalizeEmployeeNumber` strips leading zeroes before validation

---

## Plans

- **Active plans** → `plans/` at the worktree root — untracked, isolated per worktree. Each worktree has its own `plans/` so agents working in parallel don't collide. The `superpowers:writing-plans` and `prd-to-plan` skills save here by default.
- **Completed plans** → `docs.local/plans/` — permanent local archive in the main worktree. Move plans here when the work ships.

---

## Git Workflow

- **Strategy**: Trunk-based development — see [WORKFLOW.md](WORKFLOW.md) for full reference
- **Branches**: `main` (production, protected), `feature/*`, `hotfix/*`
- **Never** commit directly to `main`
- **Feature integration**: squash merge `feature/*` → `main` directly via PR
- **Hotfixes**: squash merge `hotfix/*` → `main` via PR
- **Commit format**: Conventional Commits (`type(scope): description`) — enforced via husky + commitlint
- **Quality gates**: pre-push hook runs typecheck + tests; CI runs both on push to `feature/*`/`hotfix/*` and PRs to `main`
- **Parallel agents**: use worktrees — each agent gets `git worktree add .worktrees/<name> -b feature/<name>`. The `WorktreeCreate` hook symlinks `.claude/` automatically so all agents share permissions, MCPs, and slash commands.

### Claude Slash Commands

| Command | Purpose |
|---|---|
| `/feature` | Create a feature branch from main |
| `/pr` | Draft and open a PR for the current branch |
| `/hotfix` | Create a hotfix branch from main |
| `/ship` | Promote current feature branch → main via squash-merge PR |
