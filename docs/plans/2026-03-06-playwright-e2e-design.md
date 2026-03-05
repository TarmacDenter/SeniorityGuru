# Playwright E2E Testing Setup

## Scope

Infrastructure only — config, auth helpers, fixtures, and a smoke test. No UI-specific test specs (redesign incoming).

## Structure

```
e2e/
├── playwright.config.ts      # Chromium only, baseURL localhost:3000
├── helpers/
│   └── auth.ts               # signInWithPassword -> inject Supabase session cookies
├── fixtures/
│   └── test.ts               # Custom fixtures: authenticatedPage, unauthenticatedPage
└── smoke.spec.ts             # Verify auth shortcut works, lands on /seniority
```

## Design Decisions

### Auth Strategy

- **Auth spec tests** (future): use real login form UI
- **All other specs**: use API-shortcut auth via `signInWithPassword()`, inject session cookies into the browser context
- Custom Playwright fixture `authenticatedPage` handles this automatically

### Test Users

Relies on existing seeded users from `db:seed-users`:

| User | Email | Password | Role | Profile |
|------|-------|----------|------|---------|
| Admin | admin@test.local | admin1234 | admin | no airline |
| DAL user | test@test.com | password | user | DAL, EMP0500 |
| UAL user | ual-user@test.local | password | user | UAL, EMP0400 |
| Unverified | unverified@test.com | password | user | no profile |

### Environment

- Local Supabase required (`npm run db:start`)
- Dev server required (`npm run dev`)
- Chromium only
- No CI integration yet

### Scripts

- `npm run test:e2e` — runs Playwright tests
- `npm run test:e2e:ui` — Playwright UI mode for debugging

### Config Highlights

- `baseURL`: `http://localhost:3000`
- `testDir`: `./e2e`
- No `webServer` auto-start (user manages dev server + Supabase separately)
- Chromium project only
- Screenshots on failure, trace on first retry
